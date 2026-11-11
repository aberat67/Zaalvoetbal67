
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Bestaande spelers ophalen voor het inschrijfformulier
export async function GET() {
  try {
    const result = await db.query(`
      SELECT id, first_name, last_name
      FROM players
      ORDER BY first_name ASC, last_name ASC
    `);

    return NextResponse.json({
      players: result.rows.map((player) => ({
        id: Number(player.id),
        firstName: player.first_name,
        lastName: player.last_name,
      })),
    });
  } catch (error) {
    console.error("Fout bij ophalen spelers:", error);

    return NextResponse.json(
      { error: "De spelerslijst kon niet worden opgehaald." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const client = await db.connect();
  let transactionStarted = false;

  try {
    const body = await request.json();

    await client.query("BEGIN");
    transactionStarted = true;

    let playerId: number;

    // Bestaande speler
    if (body.playerId !== undefined && body.playerId !== null) {
      playerId = Number(body.playerId);

      if (!Number.isInteger(playerId) || playerId <= 0) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return NextResponse.json(
          { error: "Selecteer een geldige speler." },
          { status: 400 }
        );
      }

      const player = await client.query(
        "SELECT id FROM players WHERE id = $1",
        [playerId]
      );

      if (player.rows.length === 0) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return NextResponse.json(
          { error: "Deze speler bestaat niet meer." },
          { status: 404 }
        );
      }
    } else {
      // Nieuwe speler
      const firstName = String(body.firstName || "").trim();
      const lastName = String(body.lastName || "").trim();

      if (
        !firstName ||
        !lastName ||
        firstName.length > 100 ||
        lastName.length > 100
      ) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return NextResponse.json(
          { error: "Vul een geldige voornaam en achternaam in." },
          { status: 400 }
        );
      }

      // Voorkom dubbele profielen bij gelijktijdige inschrijvingen
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))",
        [firstName.toLowerCase(), lastName.toLowerCase()]
      );

      const existingPlayer = await client.query(
        `SELECT id, first_name, last_name
         FROM players
         WHERE LOWER(TRIM(first_name)) = LOWER($1)
           AND LOWER(TRIM(last_name)) = LOWER($2)
         LIMIT 1`,
        [firstName, lastName]
      );

      if (existingPlayer.rows.length > 0) {
        const existing = existingPlayer.rows[0];

        await client.query("ROLLBACK");
        transactionStarted = false;

        return NextResponse.json(
          {
            error: "Deze speler bestaat al. Kies de bestaande speler.",
            existingPlayer: {
              id: Number(existing.id),
              firstName: existing.first_name,
              lastName: existing.last_name,
            },
          },
          { status: 409 }
        );
      }

      const newPlayer = await client.query(
        `INSERT INTO players (name, first_name, last_name)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [`${firstName} ${lastName}`, firstName, lastName]
      );

      playerId = Number(newPlayer.rows[0].id);
    }

    // Zoek de eerstvolgende wedstrijddag waarvoor inschrijven openstaat
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
      transactionStarted = false;

      return NextResponse.json(
        { error: "Er is momenteel geen open inschrijving." },
        { status: 400 }
      );
    }

    const matchdayId = Number(matchday.rows[0].id);

    // Controleer of deze speler al ingeschreven staat
    const alreadyRegistered = await client.query(
      `SELECT id
       FROM registrations
       WHERE matchday_id = $1 AND player_id = $2`,
      [matchdayId, playerId]
    );

    if (alreadyRegistered.rows.length > 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return NextResponse.json(
        { error: "Je bent al ingeschreven voor deze wedstrijd." },
        { status: 409 }
      );
    }

    const cancellationToken = randomBytes(32).toString("hex");

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
    transactionStarted = false;

    return NextResponse.json({
      success: true,
      position,
      status: position <= 12 ? "basisplaats" : "reserve",
      cancellationUrl: `/uitschrijven/${cancellationToken}`,
    });
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }

    console.error("Inschrijffout:", error);

    return NextResponse.json(
      { error: "Inschrijven is niet gelukt. Probeer opnieuw." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
