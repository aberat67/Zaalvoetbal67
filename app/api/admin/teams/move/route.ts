
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("zaalvoetbal_admin")?.value;

  if (!token || !verifySessionToken(token)) {
    return NextResponse.json(
      { error: "Je moet ingelogd zijn als beheerder." },
      { status: 401 }
    );
  }

  const client = await db.connect();

  try {
    const body = await request.json();
    const playerId = Number(body.playerId);
    const targetTeam = body.targetTeam === null
      ? null
      : Number(body.targetTeam);

    if (
      !Number.isInteger(playerId) ||
      playerId <= 0 ||
      (targetTeam !== null && ![1, 2].includes(targetTeam))
    ) {
      return NextResponse.json(
        { error: "Ongeldige speler of bestemming." },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const matchday = await client.query(
      `SELECT id
       FROM matchdays
       WHERE match_date >= CURRENT_DATE
       ORDER BY match_date ASC
       LIMIT 1
       FOR UPDATE`
    );

    if (matchday.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Er is geen toekomstige wedstrijd gevonden." },
        { status: 404 }
      );
    }

    const matchdayId = matchday.rows[0].id;

    const registration = await client.query(
      `SELECT id
       FROM registrations
       WHERE matchday_id = $1 AND player_id = $2`,
      [matchdayId, playerId]
    );

    if (registration.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Deze speler is niet ingeschreven voor deze wedstrijd." },
        { status: 404 }
      );
    }

    const current = await client.query(
      `SELECT tp.id, tp.team_id
       FROM team_players tp
       JOIN teams t ON t.id = tp.team_id
       WHERE t.matchday_id = $1
         AND tp.player_id = $2
       FOR UPDATE`,
      [matchdayId, playerId]
    );

    if (targetTeam === null) {
      if (current.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Deze speler staat al op de reservebank." },
          { status: 400 }
        );
      }

      await client.query(
        `DELETE FROM team_players WHERE id = $1`,
        [current.rows[0].id]
      );
    } else {
      const target = await client.query(
        `SELECT id
         FROM teams
         WHERE matchday_id = $1 AND team_number = $2`,
        [matchdayId, targetTeam]
      );

      if (target.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "De teams zijn nog niet geloot." },
          { status: 400 }
        );
      }

      if (
        current.rows.length > 0 &&
        current.rows[0].team_id === target.rows[0].id
      ) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Deze speler zit al in dit team." },
          { status: 400 }
        );
      }

      const teamCount = await client.query(
        `SELECT COUNT(*)::int AS total
         FROM team_players
         WHERE team_id = $1`,
        [target.rows[0].id]
      );

      if (teamCount.rows[0].total >= 6) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Dit team heeft al 6 spelers." },
          { status: 400 }
        );
      }

      if (current.rows.length > 0) {
        await client.query(
          `UPDATE team_players
           SET team_id = $1
           WHERE id = $2`,
          [target.rows[0].id, current.rows[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO team_players (team_id, player_id)
           VALUES ($1, $2)`,
          [target.rows[0].id, playerId]
        );
      }
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message:
        targetTeam === null
          ? "De speler staat nu op de reservebank."
          : `De speler is verplaatst naar Team ${targetTeam}.`,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Fout bij speler verplaatsen:", error);

    return NextResponse.json(
      { error: "De speler kon niet worden verplaatst." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
