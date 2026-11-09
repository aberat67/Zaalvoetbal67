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
         p.last_name
       FROM teams t
       JOIN team_players tp ON tp.team_id = t.id
       JOIN players p ON p.id = tp.player_id
       WHERE t.matchday_id = $1
       ORDER BY t.team_number, p.first_name, p.last_name`,
      [matchdayId]
    );

    return NextResponse.json({
      players: result.rows.map((player) => ({
        id: Number(player.player_id),
        name: `${player.first_name} ${player.last_name}`,
        team: Number(player.team_number),
      })),
    });
  } catch (error) {
    console.error("Spelers ophalen mislukt:", error);

    return NextResponse.json(
      { error: "De spelers konden niet worden opgehaald." },
      { status: 500 }
    );
  }
}
