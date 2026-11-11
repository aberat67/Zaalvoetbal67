
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("zaalvoetbal_admin")?.value;

  if (!token || !verifySessionToken(token)) {
    return NextResponse.json(
      { error: "Je moet ingelogd zijn als beheerder." },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const matchdayId = Number(id);

    if (!Number.isInteger(matchdayId) || matchdayId <= 0) {
      return NextResponse.json(
        { error: "Ongeldig wedstrijdnummer." },
        { status: 400 }
      );
    }

    const result = await db.query(
      `SELECT
         t.team_number,
         p.id AS player_id,
         p.first_name,
         p.last_name,
         COALESCE(s.goals, 0) AS goals,
         COALESCE(s.assists, 0) AS assists
       FROM teams t
       JOIN team_players tp ON tp.team_id = t.id
       JOIN players p ON p.id = tp.player_id
       LEFT JOIN player_match_stats s
         ON s.matchday_id = t.matchday_id
        AND s.player_id = p.id
       WHERE t.matchday_id = $1
       ORDER BY t.team_number, p.first_name, p.last_name`,
      [matchdayId]
    );

    const matchResult = await db.query(
      `SELECT team1_score, team2_score
       FROM match_results
       WHERE matchday_id = $1`,
      [matchdayId]
    );

    return NextResponse.json({
      players: result.rows.map((player) => ({
        id: Number(player.player_id),
        name: `${player.first_name} ${player.last_name}`,
        team: Number(player.team_number),
        goals: Number(player.goals),
        assists: Number(player.assists),
      })),
      result: matchResult.rows[0]
        ? {
            team1Score: Number(matchResult.rows[0].team1_score),
            team2Score: Number(matchResult.rows[0].team2_score),
          }
        : null,
    });
  } catch (error) {
    console.error("Spelers ophalen mislukt:", error);

    return NextResponse.json(
      { error: "De spelers konden niet worden opgehaald." },
      { status: 500 }
    );
  }
}
