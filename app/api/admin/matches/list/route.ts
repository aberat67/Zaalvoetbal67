import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("zaalvoetbal_admin")?.value;

  if (!token || !verifySessionToken(token)) {
    return NextResponse.json(
      { error: "Je moet ingelogd zijn als beheerder." },
      { status: 401 }
    );
  }

  try {
    const result = await db.query(
      `SELECT
         m.id,
         TO_CHAR(m.match_date, 'YYYY-MM-DD') AS match_date,
         m.location,
         m.registration_open,
         mr.team1_score,
         mr.team2_score,
         mr.played_at
       FROM matchdays m
       LEFT JOIN match_results mr ON mr.matchday_id = m.id
       ORDER BY m.match_date DESC`
    );

    return NextResponse.json({
      matches: result.rows,
    });
  } catch (error) {
    console.error("Wedstrijden ophalen mislukt:", error);

    return NextResponse.json(
      { error: "Wedstrijden konden niet worden opgehaald." },
      { status: 500 }
    );
  }
}
