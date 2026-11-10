
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("zaalvoetbal_admin")?.value;

  return Boolean(token && verifySessionToken(token));
}

async function getNextMatchday() {
  return db.query(
    `SELECT id, match_date
     FROM matchdays
     WHERE match_date >= CURRENT_DATE
     ORDER BY match_date ASC
     LIMIT 1`
  );
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Je moet ingelogd zijn als beheerder." },
      { status: 401 }
    );
  }

  try {
    const matchday = await getNextMatchday();

    if (matchday.rows.length === 0) {
      return NextResponse.json({
        matchday: null,
        players: [],
      });
    }

    const matchdayId = matchday.rows[0].id;

    const result = await db.query(
      `SELECT
         p.id,
         p.first_name,
         p.last_name,
         r.registered_at,
         r.id AS registration_id,
         t.team_number,
         ROW_NUMBER() OVER (
           ORDER BY r.registered_at ASC, r.id ASC
         ) AS position
       FROM registrations r
       JOIN players p ON p.id = r.player_id
       LEFT JOIN team_players tp
         ON tp.player_id = p.id
       LEFT JOIN teams t
         ON t.id = tp.team_id
         AND t.matchday_id = r.matchday_id
       WHERE r.matchday_id = $1
       ORDER BY r.registered_at ASC, r.id ASC`,
      [matchdayId]
    );

    return NextResponse.json({
      matchday: matchday.rows[0],
      players: result.rows.map((player) => ({
        id: player.id,
        name: `${player.first_name} ${player.last_name}`,
        position: Number(player.position),
        team:
          player.team_number === null
            ? null
            : Number(player.team_number),
      })),
    });
  } catch (error) {
    console.error("Fout bij ophalen spelers:", error);

    return NextResponse.json(
      { error: "De spelers konden niet worden opgehaald." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Je moet ingelogd zijn als beheerder." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();

    if (
      !firstName ||
      !lastName ||
      firstName.length > 50 ||
      lastName.length > 50
    ) {
      return NextResponse.json(
        { error: "Vul een geldige voornaam en achternaam in." },
        { status: 400 }
      );
    }

    const matchday = await getNextMatchday();

    if (matchday.rows.length === 0) {
      return NextResponse.json(
        { error: "Er is geen komende speeldag gevonden." },
        { status: 404 }
      );
    }

    const matchdayId = matchday.rows[0].id;
    const fullName = `${firstName} ${lastName}`;
    const cancellationToken = randomBytes(32).toString("hex");

    const player = await db.query(
      `INSERT INTO players (name, first_name, last_name)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [fullName, firstName, lastName]
    );

    await db.query(
      `INSERT INTO registrations
       (matchday_id, player_id, cancellation_token)
       VALUES ($1, $2, $3)`,
      [matchdayId, player.rows[0].id, cancellationToken]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fout bij toevoegen speler:", error);

    return NextResponse.json(
      { error: "De speler kon niet worden toegevoegd." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Je moet ingelogd zijn als beheerder." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const playerId = Number(body.playerId);
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();

    if (
      !Number.isInteger(playerId) ||
      playerId < 1 ||
      !firstName ||
      !lastName ||
      firstName.length > 50 ||
      lastName.length > 50
    ) {
      return NextResponse.json(
        { error: "Vul een geldige voornaam en achternaam in." },
        { status: 400 }
      );
    }

    const result = await db.query(
      `UPDATE players
       SET first_name = $1,
           last_name = $2,
           name = $3
       WHERE id = $4
       RETURNING id`,
      [firstName, lastName, `${firstName} ${lastName}`, playerId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Speler niet gevonden." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fout bij aanpassen speler:", error);

    return NextResponse.json(
      { error: "De speler kon niet worden aangepast." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Je moet ingelogd zijn als beheerder." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const playerId = Number(body.playerId);

    if (!Number.isInteger(playerId) || playerId < 1) {
      return NextResponse.json(
        { error: "Ongeldig spelersnummer." },
        { status: 400 }
      );
    }

    const matchday = await getNextMatchday();

    if (matchday.rows.length === 0) {
      return NextResponse.json(
        { error: "Er is geen komende speeldag gevonden." },
        { status: 404 }
      );
    }

    const matchdayId = matchday.rows[0].id;

    await db.query(
      `DELETE FROM team_players
       WHERE player_id = $1
       AND team_id IN (
         SELECT id FROM teams WHERE matchday_id = $2
       )`,
      [playerId, matchdayId]
    );

    const result = await db.query(
      `DELETE FROM registrations
       WHERE player_id = $1 AND matchday_id = $2
       RETURNING id`,
      [playerId, matchdayId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Deze speler staat niet ingeschreven voor de komende speeldag." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fout bij verwijderen speler:", error);

    return NextResponse.json(
      { error: "De speler kon niet worden verwijderd." },
      { status: 500 }
    );
  }
}
