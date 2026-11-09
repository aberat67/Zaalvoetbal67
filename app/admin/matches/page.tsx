import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";
import CreateMatchForm from "./CreateMatchForm";
import MatchList from "./MatchList";
import ResultForm from "./ResultForm";

export default async function AdminMatchesPage() {
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
          Wedstrijden beheren
        </h1>

        <p className="muted" style={{ marginTop: 10 }}>
          Maak wedstrijden aan, beheer de geschiedenis en registreer uitslagen.
        </p>

        <div className="card" style={{ marginTop: 25 }}>
          <h2>Nieuwe wedstrijd aanmaken</h2>
          <CreateMatchForm />
        </div>

        <div className="card" style={{ marginTop: 25 }}>
          <MatchList />
        </div>

        <div className="card" style={{ marginTop: 25 }}>
          <h2>Uitslag invoeren</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Selecteer een wedstrijd en vul de score, doelpunten en assists in.
          </p>
          <ResultForm />
        </div>
      </section>
    </main>
  );
}
