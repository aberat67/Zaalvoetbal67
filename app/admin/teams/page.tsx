
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";
import ManageTeams from "../ManageTeams";
import DrawTeamsButton from "../DrawTeamsButton";

export default async function AdminTeamsPage() {
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
          Teams beheren
        </h1>

        <p className="muted" style={{ marginTop: 10 }}>
          Beheer de teamverdeling en reservebank.
        </p>

        <div className="card" style={{ marginTop: 24 }}>
          <h2>Teams opnieuw loten</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Verdeel de eerste 12 ingeschreven spelers opnieuw.
          </p>
          <div style={{ marginTop: 16 }}>
            <DrawTeamsButton />
          </div>
        </div>

        <ManageTeams />
      </section>
    </main>
  );
}
