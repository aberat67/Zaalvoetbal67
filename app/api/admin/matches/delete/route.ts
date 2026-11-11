
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("zaalvoetbal_admin")?.value;

  if (!token || !verifySessionToken(token)) {
    return NextResponse.json(
      { error: "Je moet ingelogd zijn als beheerder." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const matchdayId = Number(body?.matchdayId);

  if (!Number.isInteger(matchdayId) || matchdayId <= 0) {
    return NextResponse.json(
      { error: "Ongeldige wedstrijddag." },
      { status: 400 }
    );
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const matchday = await client.query(
      `SELECT id
       FROM matchdays
       WHERE id = $1
       FOR UPDATE`,
      [matchdayId]
    );

    if (matchday.rows.length === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        { error: "Deze wedstrijd bestaat niet." },
        { status: 404 }
      );
    }

    await client.query(
      `DELETE FROM player_match_stats
       WHERE matchday_id = $1`,
      [matchdayId]
    );

    await client.query(
      `DELETE FROM team_players
       WHERE team_id IN (
         SELECT id FROM teams WHERE matchday_id = $1
       )`,
      [matchdayId]
    );

    await client.query(
      `DELETE FROM teams WHERE matchday_id = $1`,
      [matchdayId]
    );

    await client.query(
      `DELETE FROM registrations
       WHERE matchday_id = $1`,
      [matchdayId]
    );

    await client.query(
      `DELETE FROM match_results
       WHERE matchday_id = $1`,
      [matchdayId]
    );

    await client.query(
      `DELETE FROM matchdays WHERE id = $1`,
      [matchdayId]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "De wedstrijddag en bijbehorende gegevens zijn verwijderd.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Wedstrijddag verwijderen mislukt:", error);

    return NextResponse.json(
      { error: "De wedstrijddag kon niet worden verwijderd." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
