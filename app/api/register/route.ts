
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();

    if (
      !firstName ||
      !lastName ||
      firstName.length > 100 ||
      lastName.length > 100
    ) {
      return NextResponse.json(
        { error: "Vul een geldige voornaam en achternaam in." },
        { status: 400 }
      );
    }

    const matchday = await db.query(
      `SELECT id
       FROM matchdays
       WHERE registration_open = TRUE
       ORDER BY match_date ASC
       LIMIT 1`
    );

    if (matchday.rows.length === 0) {
      return NextResponse.json(
        { error: "Er is momenteel geen open inschrijving." },
        { status: 400 }
      );
    }

    const matchdayId = matchday.rows[0].id;

    const result = await db.query(
      `INSERT INTO players (name, first_name, last_name)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [`${firstName} ${lastName}`, firstName, lastName]
    );

    const playerId = result.rows[0].id;

    try {
      await db.query(
        `INSERT INTO registrations (matchday_id, player_id)
         VALUES ($1, $2)`,
        [matchdayId, playerId]
      );
    } catch (error) {
      await db.query("DELETE FROM players WHERE id = $1", [playerId]);
      throw error;
    }

    const position = await db.query(
      `SELECT COUNT(*)::int AS position
       FROM registrations
       WHERE matchday_id = $1
         AND registered_at <= (
           SELECT registered_at
           FROM registrations
           WHERE matchday_id = $1 AND player_id = $2
         )`,
      [matchdayId, playerId]
    );

    return NextResponse.json({
      success: true,
      position: position.rows[0].position,
      status: position.rows[0].position <= 12 ? "basisplaats" : "reserve",
    });
  } catch (error) {
    console.error("Inschrijffout:", error);

    return NextResponse.json(
      { error: "Inschrijven is niet gelukt. Probeer opnieuw." },
      { status: 500 }
    );
  }
}
