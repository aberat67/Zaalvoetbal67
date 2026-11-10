
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const client = await db.connect();

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

    await client.query("BEGIN");

    const matchday = await client.query(
      `SELECT id
       FROM matchdays
       WHERE registration_open = TRUE
         AND match_date >= CURRENT_DATE
       ORDER BY match_date ASC
       LIMIT 1
       FOR UPDATE`
    );

    if (matchday.rows.length === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        { error: "Er is momenteel geen open inschrijving." },
        { status: 400 }
      );
    }

    const matchdayId = Number(matchday.rows[0].id);
    const cancellationToken = randomBytes(32).toString("hex");

    const playerResult = await client.query(
      `INSERT INTO players (name, first_name, last_name)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [`${firstName} ${lastName}`, firstName, lastName]
    );

    const playerId = Number(playerResult.rows[0].id);

    await client.query(
      `INSERT INTO registrations
       (matchday_id, player_id, cancellation_token)
       VALUES ($1, $2, $3)`,
      [matchdayId, playerId, cancellationToken]
    );

    const positionResult = await client.query(
      `SELECT COUNT(*)::int AS position
       FROM registrations r
       WHERE r.matchday_id = $1
         AND (
           r.registered_at < (
             SELECT registered_at
             FROM registrations
             WHERE matchday_id = $1 AND player_id = $2
           )
           OR (
             r.registered_at = (
               SELECT registered_at
               FROM registrations
               WHERE matchday_id = $1 AND player_id = $2
             )
             AND r.id <= (
               SELECT id
               FROM registrations
               WHERE matchday_id = $1 AND player_id = $2
             )
           )
         )`,
      [matchdayId, playerId]
    );

    const position = Number(positionResult.rows[0].position);

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      position,
      status: position <= 12 ? "basisplaats" : "reserve",
      cancellationUrl: `/uitschrijven/${cancellationToken}`,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Inschrijffout:", error);

    return NextResponse.json(
      { error: "Inschrijven is niet gelukt. Probeer opnieuw." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
