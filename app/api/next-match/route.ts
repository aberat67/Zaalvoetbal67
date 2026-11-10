
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db.query(`
      SELECT
        m.id,
        m.match_date,
        m.location,
        m.registration_open,
        COUNT(r.id)::int AS registered_count
      FROM matchdays m
      LEFT JOIN registrations r ON r.matchday_id = m.id
      WHERE m.match_date >= CURRENT_DATE
      GROUP BY m.id
      ORDER BY m.match_date ASC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return NextResponse.json({ match: null });
    }

    const match = result.rows[0];
    const registeredCount = Number(match.registered_count);

    return NextResponse.json({
      match: {
        id: Number(match.id),
        date: match.match_date,
        location: match.location,
        registrationOpen: match.registration_open,
        registeredCount,
        starterCount: Math.min(registeredCount, 12),
        reserveCount: Math.max(0, registeredCount - 12),
        availablePlaces: Math.max(0, 12 - registeredCount),
      },
    });
  } catch (error) {
    console.error("Volgende wedstrijd ophalen mislukt:", error);

    return NextResponse.json(
      { error: "De volgende wedstrijd kon niet worden opgehaald." },
      { status: 500 }
    );
  }
}
