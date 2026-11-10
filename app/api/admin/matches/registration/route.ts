
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const matchdayId = Number(body.matchdayId);
    const registrationOpen = body.registrationOpen;

    if (
      !Number.isInteger(matchdayId) ||
      matchdayId <= 0 ||
      typeof registrationOpen !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Ongeldige gegevens." },
        { status: 400 }
      );
    }

    const result = await db.query(
      `UPDATE matchdays
       SET registration_open = $1
       WHERE id = $2
       RETURNING id, registration_open`,
      [registrationOpen, matchdayId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Wedstrijd niet gevonden." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      matchdayId: Number(result.rows[0].id),
      registrationOpen: result.rows[0].registration_open,
    });
  } catch (error) {
    console.error("Inschrijvingen aanpassen mislukt:", error);

    return NextResponse.json(
      { error: "De inschrijvingen konden niet worden aangepast." },
      { status: 500 }
    );
  }
}
