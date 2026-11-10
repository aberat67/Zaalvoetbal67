
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db.query(`
      SELECT
        id,
        match_date,
        registration_open
      FROM matchdays
      WHERE match_date >= CURRENT_DATE
      ORDER BY match_date ASC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return NextResponse.json({
        exists: false,
        registrationOpen: false,
      });
    }

    return NextResponse.json({
      exists: true,
      matchdayId: Number(result.rows[0].id),
      registrationOpen: result.rows[0].registration_open,
    });
  } catch (error) {
    console.error("Inschrijvingsstatus ophalen mislukt:", error);

    return NextResponse.json(
      { error: "Status kon niet worden opgehaald." },
      { status: 500 }
    );
  }
}
