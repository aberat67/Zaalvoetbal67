
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
    const targetTeam = Number(body.targetTeam);

    if (
      !Number.isInteger(playerId) ||
      playerId <= 0 ||
      ![1, 2].includes(targetTeam)
    ) {
      return NextResponse.json(
        { error: "Ongeldige speler of team." },
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

    const current = await client.query(
      `SELECT tp.id, tp.team_id
       FROM team_players tp
       JOIN teams t ON t.id = tp.team_id
       WHERE t.matchday_id = $1
         AND tp.player_id = $2
       FOR UPDATE`,
      [matchdayId, playerId]
    );

    if (current.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Deze speler zit niet in een team." },
        { status: 404 }
      );
    }

    const currentTeam = await client.query(
      `SELECT team_number
       FROM teams
       WHERE id = $1`,
      [current.rows[0].team_id]
    );

    if (currentTeam.rows[0].team_number === targetTeam) {
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

    await client.query(
      `UPDATE team_players
       SET team_id = $1
       WHERE id = $2`,
      [target.rows[0].id, current.rows[0].id]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: `De speler is verplaatst naar Team ${targetTeam}.`,
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
