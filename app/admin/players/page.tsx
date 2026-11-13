
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";
import PlayersManager from "./PlayersManager";

export default async function AdminPlayersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("zaalvoetbal_admin")?.value;

  if (!token || !verifySessionToken(token)) {
    redirect("/admin/login");
  }

  return (
    <main className="container">
      <nav className="navbar">
        <a href="/" className="logo">
          ZAAL<span>VOETBAL.</span>
        </a>
        <a href="/admin" className="btn btn-secondary">
          ← Beheerdersmenu
        </a>
      </nav>

      <section className="section">
        <span className="badge badge-success">
          BEHEERDERSOMGEVING
        </span>

        <h1 style={{ fontSize: 36, fontWeight: 900, marginTop: 18 }}>
          Spelers beheren
        </h1>

        <p className="muted" style={{ marginTop: 10 }}>
          Bekijk alle aangemaakte spelers, voeg nieuwe spelers toe of verwijder
          spelers die niet meer meedoen.
        </p>

        <PlayersManager />
      </section>
    </main>
  );
}

