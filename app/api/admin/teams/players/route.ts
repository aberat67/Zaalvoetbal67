
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("zaalvoetbal_admin")?.value;

  if (!token || !verifySessionToken(token)) {
    return NextResponse.json(
      { error: "Je moet ingelogd zijn als beheerder." },
      { status: 401 }
    );
  }

  try {
    const matchday = await db.query(
      `SELECT id, match_date
       FROM matchdays
       WHERE match_date >= CURRENT_DATE
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
