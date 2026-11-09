
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
          Je bent veilig ingelogd. Hier beheren we straks de volledige
          zaalvoetbalwebsite.
        </p>

        <div className="grid" style={{ marginTop: 30 }}>
          <div className="card">
            <h2>Spelers</h2>
            <p className="muted">Spelers beheren en aanpassen.</p>
          </div>

          <div className="card">
            <h2>Inschrijvingen</h2>
            <p className="muted">Inschrijvingen bekijken en beheren.</p>
          </div>

          <div className="card">
            <h2>Teams</h2>
            <p className="muted">Teams verdelen en aanpassen.</p>
          </div>

          <div className="card">
            <h2>Wedstrijden</h2>
            <p className="muted">Wedstrijden en uitslagen beheren.</p>
          </div>

          <div className="card">
            <h2>Statistieken</h2>
            <p className="muted">Doelpunten, assists en overwinningen.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
