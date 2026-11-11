
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const matchday = await db.query(
      `SELECT id, match_date
       FROM matchdays
       WHERE match_date >= CURRENT_DATE
       ORDER BY match_date ASC
       LIMIT 1`
    );

    if (matchday.rows.length === 0) {
      return NextResponse.json({ teams: [] });
    }

    const matchdayId = matchday.rows[0].id;

    const result = await db.query(
      `SELECT
         t.team_number,
         p.id AS player_id,
         p.first_name,
         p.last_name
       FROM teams t
       LEFT JOIN team_players tp ON tp.team_id = t.id
       LEFT JOIN players p ON p.id = tp.player_id
       WHERE t.matchday_id = $1
       ORDER BY
         t.team_number ASC,
         p.first_name ASC,
         p.last_name ASC`,
      [matchdayId]
    );

    const teams = [1, 2].map((number) => ({
      team_number: number,
      players: result.rows
        .filter(
          (row) =>
            row.team_number === number &&
            row.player_id !== null
        )
        .map((row) => ({
          id: row.player_id,
          name: `${row.first_name} ${row.last_name}`,
        })),
    }));

    return NextResponse.json({
      matchday: matchday.rows[0],
      teams,
    });
  } catch (error) {
    console.error("Fout bij ophalen teams:", error);

    return NextResponse.json(
      { error: "De teams konden niet worden opgehaald." },
      { status: 500 }
    );
  }
}
