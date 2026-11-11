
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomInt } from "crypto";
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

  const body = await request.json().catch(() => null);
  const numberOfPlayers = body?.numberOfPlayers;

  if (![12, 13, 14].includes(numberOfPlayers)) {
    return NextResponse.json(
      { error: "Kies 12, 13 of 14 spelers." },
      { status: 400 }
    );
  }

  const client = await db.connect();

  try {
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
        { error: "Er is geen toekomstige wedstrijd aangemaakt." },
        { status: 400 }
      );
    }

    const matchdayId = matchday.rows[0].id;

    const result = await client.query(
      `SELECT player_id
       FROM registrations
       WHERE matchday_id = $1
       ORDER BY registered_at ASC, id ASC
       LIMIT $2`,
      [matchdayId, numberOfPlayers]
    );

    if (result.rows.length < numberOfPlayers) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          error: `Er zijn maar ${result.rows.length} spelers ingeschreven. Je hebt er ${numberOfPlayers} nodig.`,
        },
        { status: 400 }
      );
    }

    const players = [...result.rows];

    for (let i = players.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [players[i], players[j]] = [players[j], players[i]];
    }

    await client.query(
      "DELETE FROM teams WHERE matchday_id = $1",
      [matchdayId]
    );

    const team1Count = Math.ceil(numberOfPlayers / 2);
    const team2Count = Math.floor(numberOfPlayers / 2);

    const team1 = await client.query(
      `INSERT INTO teams (matchday_id, team_number)
       VALUES ($1, 1)
       RETURNING id`,
      [matchdayId]
    );

    const team2 = await client.query(
      `INSERT INTO teams (matchday_id, team_number)
       VALUES ($1, 2)
       RETURNING id`,
      [matchdayId]
    );

    for (let i = 0; i < players.length; i++) {
      const teamId = i < team1Count
        ? team1.rows[0].id
        : team2.rows[0].id;

      await client.query(
        `INSERT INTO team_players (team_id, player_id)
         VALUES ($1, $2)`,
        [teamId, players[i].player_id]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      team1Players: team1Count,
      team2Players: team2Count,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Teams loten mislukt:", error);

    return NextResponse.json(
      { error: "De teams konden niet worden verdeeld." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
