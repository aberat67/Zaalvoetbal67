
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomInt } from "crypto";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
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
    await client.query("BEGIN");

    const matchday = await client.query(
      `SELECT id
       FROM matchdays
       ORDER BY match_date ASC
       LIMIT 1
       FOR UPDATE`
    );

    if (matchday.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Er is nog geen wedstrijd aangemaakt." },
        { status: 400 }
      );
    }

    const matchdayId = matchday.rows[0].id;

    const result = await client.query(
      `SELECT player_id
       FROM registrations
       WHERE matchday_id = $1
       ORDER BY registered_at ASC, id ASC
       LIMIT 12`,
      [matchdayId]
    );

    if (result.rows.length !== 12) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Er moeten precies 12 spelers ingeschreven zijn om teams te loten." },
        { status: 400 }
      );
    }

    // Schud de 12 spelers willekeurig door elkaar.
    const players = [...result.rows];

    for (let i = players.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [players[i], players[j]] = [players[j], players[i]];
    }

    // Verwijder de vorige teamindeling.
    await client.query(
      "DELETE FROM teams WHERE matchday_id = $1",
      [matchdayId]
    );

    // Maak twee nieuwe teams.
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

    // Verdeel zes spelers per team.
    for (let i = 0; i < 12; i++) {
      const teamId =
        i < 6 ? team1.rows[0].id : team2.rows[0].id;

      await client.query(
        `INSERT INTO team_players (team_id, player_id)
         VALUES ($1, $2)`,
        [teamId, players[i].player_id]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "De teams zijn succesvol verdeeld.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Fout bij teamverdeling:", error);

    return NextResponse.json(
      { error: "De teams konden niet worden verdeeld." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
