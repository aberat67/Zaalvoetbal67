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
    const otherPlayerId = Number(body.otherPlayerId);

    if (
      !Number.isInteger(playerId) ||
      !Number.isInteger(otherPlayerId) ||
      playerId <= 0 ||
      otherPlayerId <= 0 ||
      playerId === otherPlayerId
    ) {
      return NextResponse.json(
        { error: "Ongeldige spelers geselecteerd." },
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
        { error: "Geen toekomstige wedstrijd gevonden." },
        { status: 404 }
      );
    }

    const matchdayId = matchday.rows[0].id;

    const players = await client.query(
      `SELECT
         tp.player_id,
         t.id AS team_id,
         t.team_number
       FROM team_players tp
       JOIN teams t ON t.id = tp.team_id
       WHERE t.matchday_id = $1
         AND tp.player_id = ANY($2::int[])
       FOR UPDATE`,
      [matchdayId, [playerId, otherPlayerId]]
    );

    if (players.rows.length !== 2) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Beide spelers moeten in een team zitten." },
        { status: 400 }
      );
    }

    const first = players.rows.find(
      (player) => Number(player.player_id) === playerId
    );

    const second = players.rows.find(
      (player) => Number(player.player_id) === otherPlayerId
    );

    if (!first || !second || first.team_id === second.team_id) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Kies twee spelers uit verschillende teams." },
        { status: 400 }
      );
    }

    await client.query(
      `UPDATE team_players
       SET team_id = $1
       WHERE player_id = $2`,
      [second.team_id, playerId]
    );

    await client.query(
      `UPDATE team_players
       SET team_id = $1
       WHERE player_id = $2`,
      [first.team_id, otherPlayerId]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "De spelers zijn succesvol gewisseld.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Fout bij spelers wisselen:", error);

    return NextResponse.json(
      { error: "De spelers konden niet worden gewisseld." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
