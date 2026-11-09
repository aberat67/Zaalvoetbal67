import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("zaalvoetbal_admin")?.value;

  if (!token || !verifySessionToken(token)) {
    return NextResponse.json(
      { error: "Je moet ingelogd zijn als beheerder." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const matchDate = String(body.matchDate || "");
    const location = String(body.location || "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(matchDate)) {
      return NextResponse.json(
        { error: "Vul een geldige wedstrijddatum in." },
        { status: 400 }
      );
    }

    const result = await db.query(
      `INSERT INTO matchdays (match_date, location, registration_open)
       VALUES ($1, $2, TRUE)
       RETURNING id, match_date, location`,
      [matchDate, location || null]
    );

    return NextResponse.json({
      success: true,
      match: result.rows[0],
    });
  } catch (error) {
    console.error("Wedstrijd aanmaken mislukt:", error);

    return NextResponse.json(
      { error: "De wedstrijd kon niet worden aangemaakt." },
      { status: 500 }
    );
  }
}
