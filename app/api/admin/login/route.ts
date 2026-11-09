
import { NextResponse } from "next/server";
import {
  createSessionToken,
  verifyAdminPassword,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = String(body.password || "");

    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: "Het wachtwoord is niet correct." },
        { status: 401 }
      );
    }

    const token = createSessionToken();

    const response = NextResponse.json({
      success: true,
      message: "Je bent ingelogd.",
    });

    response.cookies.set("zaalvoetbal_admin", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Inloggen is niet gelukt." },
      { status: 400 }
    );
  }
}
