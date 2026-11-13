
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("zaalvoetbal_admin")?.value;
  return !!token && verifySessionToken(token);
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Je moet ingelogd zijn als beheerder." },
      { status: 401 }
    );
  }

  try {
    const result = await db.query(`
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.name,
        p.created_at,
        COUNT(DISTINCT r.id)::int AS registrations,
        COUNT(DISTINCT s.id)::int AS matches
      FROM players p
      LEFT JOIN registrations r ON r.player_id = p.id
      LEFT JOIN player_match_stats s ON s.player_id = p.id
      GROUP BY p.id
      ORDER BY p.first_name, p.last_name
    `);

    return NextResponse.json({ players: result.rows });
  } catch (error) {
    console.error("Spelers ophalen mislukt:", error);
    return NextResponse.json(
      { error: "Spelers konden niet worden opgehaald." },
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

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Vul een voornaam en achternaam in." },
        { status: 400 }
      );
    }

    const existing = await db.query(
      `SELECT id FROM players
       WHERE LOWER(first_name) = LOWER($1)
       AND LOWER(last_name) = LOWER($2)
       LIMIT 1`,
      [firstName, lastName]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Deze speler bestaat al." },
        { status: 409 }
      );
    }

    const result = await db.query(
      `INSERT INTO players (first_name, last_name, name)
       VALUES ($1, $2, $3)
       RETURNING id, first_name, last_name, name, created_at`,
      [firstName, lastName, `${firstName} ${lastName}`]
    );

    return NextResponse.json({
      success: true,
      player: result.rows[0],
    });
  } catch (error) {
    console.error("Speler aanmaken mislukt:", error);
    return NextResponse.json(
      { error: "De speler kon niet worden aangemaakt." },
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

  const client = await db.connect();

  try {
    const body = await request.json();
    const playerId = Number(body.playerId);

    if (!Number.isInteger(playerId) || playerId <= 0) {
      return NextResponse.json(
        { error: "Ongeldig spelersnummer." },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const player = await client.query(
      "SELECT id FROM players WHERE id = $1 FOR UPDATE",
      [playerId]
    );

    if (player.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Speler niet gevonden." },
        { status: 404 }
      );
    }

    const stats = await client.query(
      "SELECT COUNT(*)::int AS total FROM player_match_stats WHERE player_id = $1",
      [playerId]
    );

    if (stats.rows[0].total > 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          error:
            "Deze speler heeft wedstrijdstatistieken. Verwijderen is geblokkeerd om de historische statistieken te bewaren.",
        },
        { status: 409 }
      );
    }

    await client.query(
      "DELETE FROM team_players WHERE player_id = $1",
      [playerId]
    );

    await client.query(
      "DELETE FROM registrations WHERE player_id = $1",
      [playerId]
    );

    await client.query(
      "DELETE FROM players WHERE id = $1",
      [playerId]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "Speler verwijderd.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Speler verwijderen mislukt:", error);

    return NextResponse.json(
      { error: "De speler kon niet worden verwijderd." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
