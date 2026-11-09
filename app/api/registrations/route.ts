
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const matchday = await db.query(
      `SELECT id, match_date
       FROM matchdays
       ORDER BY match_date ASC
       LIMIT 1`
    );

    if (matchday.rows.length === 0) {
      return NextResponse.json({
        matchday: null,
        players: [],
      });
    }

    const matchdayId = matchday.rows[0].id;

    const result = await db.query(
      `SELECT
         r.id,
         p.first_name,
         p.last_name,
         r.registered_at
       FROM registrations r
       JOIN players p ON p.id = r.player_id
       WHERE r.matchday_id = $1
       ORDER BY r.registered_at ASC, r.id ASC`,
      [matchdayId]
    );

    const players = result.rows.map((player, index) => ({
      id: player.id,
      name: `${player.first_name} ${player.last_name}`,
      position: index + 1,
      status: index < 12 ? "basisplaats" : "reserve",
    }));

    return NextResponse.json({
      matchday: matchday.rows[0],
      players,
    });
  } catch (error) {
    console.error("Fout bij ophalen inschrijvingen:", error);

    return NextResponse.json(
      { error: "De inschrijvingen konden niet worden opgehaald." },
      { status: 500 }
    );
  }
}
