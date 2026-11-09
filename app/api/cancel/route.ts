
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body.token || "");

    if (!/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json(
        { error: "Deze uitschrijflink is ongeldig." },
        { status: 400 }
      );
    }

    const result = await db.query(
      `DELETE FROM registrations
       WHERE cancellation_token = $1
       RETURNING player_id`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Deze link is ongeldig of je bent al uitgeschreven." },
        { status: 404 }
      );
    }

    const playerId = result.rows[0].player_id;

    // Verwijder de speler alleen als die geen andere inschrijvingen heeft.
    await db.query(
      `DELETE FROM players
       WHERE id = $1
       AND NOT EXISTS (
         SELECT 1 FROM registrations WHERE player_id = $1
       )
       AND NOT EXISTS (
         SELECT 1 FROM team_players WHERE player_id = $1
       )
       AND NOT EXISTS (
         SELECT 1 FROM player_match_stats WHERE player_id = $1
       )`,
      [playerId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Uitschrijffout:", error);

    return NextResponse.json(
      { error: "Uitschrijven is niet gelukt. Probeer opnieuw." },
      { status: 500 }
    );
  }
}
