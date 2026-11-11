
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("zaalvoetbal_admin")?.value;

  if (!token || !verifySessionToken(token)) {
    return NextResponse.json(
      { error: "Je moet ingelogd zijn als beheerder." },
      { status: 401 }
    );
  }

  let client;

  try {
    const body = await request.json();

    const matchdayId = Number(body.matchdayId);
    const team1Score = Number(body.team1Score);
    const team2Score = Number(body.team2Score);
    const stats = body.stats;

    if (
      !Number.isInteger(matchdayId) ||
      matchdayId <= 0 ||
      !Number.isInteger(team1Score) ||
      !Number.isInteger(team2Score) ||
      team1Score < 0 ||
      team2Score < 0 ||
      team1Score > 50 ||
      team2Score > 50 ||
      !Array.isArray(stats) ||
      stats.length !== 12
    ) {
      return NextResponse.json(
        { error: "Controleer de uitslag en vul alle 12 spelers in." },
        { status: 400 }
      );
    }

    client = await db.connect();
    await client.query("BEGIN");

    const matchday = await client.query(
      `SELECT id
       FROM matchdays
       WHERE id = $1
       FOR UPDATE`,
      [matchdayId]
    );

    if (matchday.rows.length === 0) {
      throw new Error("Deze wedstrijd bestaat niet.");
    }

    const teams = await client.query(
      `SELECT t.team_number, tp.player_id
       FROM teams t
       JOIN team_players tp ON tp.team_id = t.id
       WHERE t.matchday_id = $1
       ORDER BY t.team_number`,
      [matchdayId]
    );

    const team1Players = teams.rows
      .filter((row) => Number(row.team_number) === 1)
      .map((row) => Number(row.player_id));

    const team2Players = teams.rows
      .filter((row) => Number(row.team_number) === 2)
      .map((row) => Number(row.player_id));

    if (
      teams.rows.length !== 12 ||
      team1Players.length !== 6 ||
      team2Players.length !== 6 ||
      new Set(teams.rows.map((row) => Number(row.player_id))).size !== 12
    ) {
      throw new Error("Beide teams moeten elk 6 verschillende spelers hebben.");
    }

    let goals1 = 0;
    let goals2 = 0;

    const playerStats = new Map<
      number,
      { team: number; goals: number; assists: number }
    >();

    for (const item of stats) {
      const playerId = Number(item.playerId);
      const teamNumber = Number(item.teamNumber);
      const goals = Number(item.goals);
      const assists = Number(item.assists);

      if (
        !Number.isInteger(playerId) ||
        playerId <= 0 ||
        !Number.isInteger(teamNumber) ||
        ![1, 2].includes(teamNumber) ||
        !Number.isInteger(goals) ||
        !Number.isInteger(assists) ||
        goals < 0 ||
        assists < 0 ||
        goals > 50 ||
        assists > 50 ||
        playerStats.has(playerId)
      ) {
        throw new Error("Ongeldige of dubbele spelersstatistieken.");
      }

      const validPlayers =
        teamNumber === 1 ? team1Players : team2Players;

      if (!validPlayers.includes(playerId)) {
        throw new Error("Een speler hoort niet bij het gekozen team.");
      }

      playerStats.set(playerId, {
        team: teamNumber,
        goals,
        assists,
      });

      if (teamNumber === 1) goals1 += goals;
      if (teamNumber === 2) goals2 += goals;
    }

    const allPlayers = [...team1Players, ...team2Players];

    if (
      playerStats.size !== 12 ||
      allPlayers.some((playerId) => !playerStats.has(playerId))
    ) {
      throw new Error("Alle 12 spelers moeten precies één keer ingevuld zijn.");
    }

    if (goals1 !== team1Score || goals2 !== team2Score) {
      throw new Error(
        "Het aantal geregistreerde doelpunten moet overeenkomen met de eindstand."
      );
    }

    await client.query(
      `INSERT INTO match_results
       (matchday_id, team1_score, team2_score, played_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (matchday_id)
       DO UPDATE SET
         team1_score = EXCLUDED.team1_score,
         team2_score = EXCLUDED.team2_score,
         played_at = NOW()`,
      [matchdayId, team1Score, team2Score]
    );

    await client.query(
      `DELETE FROM player_match_stats
       WHERE matchday_id = $1`,
      [matchdayId]
    );

    for (const [playerId, stat] of playerStats) {
      const result =
        team1Score === team2Score
          ? "draw"
          : (team1Score > team2Score
              ? stat.team === 1
              : stat.team === 2)
            ? "win"
            : "loss";

      await client.query(
        `INSERT INTO player_match_stats
         (matchday_id, player_id, goals, assists, team_number, result)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          matchdayId,
          playerId,
          stat.goals,
          stat.assists,
          stat.team,
          result,
        ]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "De uitslag en alle 12 spelersstatistieken zijn opgeslagen.",
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Terugdraaien mislukt:", rollbackError);
      }
    }

    console.error("Uitslag opslaan mislukt:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "De uitslag kon niet worden opgeslagen.",
      },
      { status: 500 }
    );
  } finally {
    client?.release();
  }
}
