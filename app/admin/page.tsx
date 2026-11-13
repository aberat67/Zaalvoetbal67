
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";

export default async function AdminPage() {
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
        <a href="/" className="btn btn-secondary">
          ← Website
        </a>
      </nav>

      <section className="section">
        <span className="badge badge-success">
          BEHEERDERSOMGEVING
        </span>

        <h1 style={{ fontSize: 38, fontWeight: 900, marginTop: 18 }}>
          Welkom, beheerder!
        </h1>

        <p className="muted" style={{ marginTop: 10 }}>
          Beheer hier de wedstrijden, spelers en teams.
        </p>

        <div className="grid" style={{ marginTop: 30 }}>
          <a
            href="/admin/players"
            className="card"
            style={{
              display: "block",
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            <h2>👥 Spelers beheren</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Alle spelers bekijken, toevoegen, aanpassen en verwijderen.
            </p>
            <p style={{ marginTop: 14, color: "#75d99a" }}>
              Open spelersbeheer →
            </p>
          </a>

          <div className="card">
            <h2>Inschrijvingen</h2>
            <p className="muted">Inschrijvingen bekijken en beheren.</p>
          </div>

          <a
            href="/admin/teams"
            className="card"
            style={{
              display: "block",
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            <h2>⚽ Teams beheren</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Teams loten, spelers verplaatsen en de reservebank beheren.
            </p>
            <p style={{ marginTop: 14, color: "#75d99a" }}>
              Open teambeheer →
            </p>
          </a>

          <a
            href="/admin/matches"
            className="card"
            style={{
              display: "block",
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            <h2>⚽ Wedstrijden beheren</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Wedstrijden aanmaken, uitslagen invoeren en doelpunten registreren.
            </p>
            <p style={{ marginTop: 14, color: "#75d99a" }}>
              Open wedstrijdbeheer →
            </p>
          </a>

          <a
  href="/admin/stats"
  className="card"
  style={{
    display: "block",
    textDecoration: "none",
    color: "inherit",
    cursor: "pointer",
  }}
>
  <h2>📊 Statistieken</h2>
  <p className="muted" style={{ marginTop: 8 }}>
    Bekijk topscorers, overwinningen en persoonlijke statistieken.
  </p>
  <p style={{ marginTop: 14, color: "#75d99a" }}>
    Open statistieken →
  </p>
</a>
        </div>
      </section>
    </main>
  );
}
