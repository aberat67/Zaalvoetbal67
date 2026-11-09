
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db.query(`
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        COUNT(s.id)::int AS matches_played,
        COALESCE(SUM(s.goals), 0)::int AS goals,
        COALESCE(SUM(s.assists), 0)::int AS assists,
        COUNT(s.id) FILTER (WHERE s.result = 'win')::int AS wins,
        COUNT(s.id) FILTER (WHERE s.result = 'draw')::int AS draws,
        COUNT(s.id) FILTER (WHERE s.result = 'loss')::int AS losses,
        CASE
          WHEN COUNT(s.id) = 0 THEN 0
          ELSE ROUND(
            COUNT(s.id) FILTER (WHERE s.result = 'win') * 100.0
            / COUNT(s.id)
          )::int
        END AS win_percentage
      FROM players p
      LEFT JOIN player_match_stats s ON s.player_id = p.id
      GROUP BY p.id, p.first_name, p.last_name
      ORDER BY goals DESC, assists DESC, wins DESC, p.first_name ASC
    `);

    return NextResponse.json({
      players: result.rows.map((player) => ({
        id: Number(player.id),
        name: `${player.first_name} ${player.last_name}`,
        matchesPlayed: Number(player.matches_played),
        goals: Number(player.goals),
        assists: Number(player.assists),
        wins: Number(player.wins),
        draws: Number(player.draws),
        losses: Number(player.losses),
        winPercentage: Number(player.win_percentage),
      })),
    });
  } catch (error) {
    console.error("Statistieken ophalen mislukt:", error);
    return NextResponse.json(
      { error: "Statistieken konden niet worden opgehaald." },
      { status: 500 }
    );
  }
}
