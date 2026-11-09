
"use client";

import { useEffect, useState } from "react";

type Player = {
  id: number;
  name: string;
  position: number;
  status: "basisplaats" | "reserve";
};

type RegistrationData = {
  matchday: {
    id: number;
    match_date: string;
  } | null;
  players: Player[];
};

export default function InschrijvingenPage() {
  const [data, setData] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRegistrations() {
      try {
        const response = await fetch("/api/registrations");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Ophalen mislukt.");
        }

        setData(result);
      } catch {
        setError("De inschrijvingen konden niet worden geladen.");
      } finally {
        setLoading(false);
      }
    }

    loadRegistrations();
  }, []);

  return (
    <main className="container">
      <nav className="navbar">
        <a href="/" className="logo">
          ZAAL<span>VOETBAL.</span>
        </a>
        <a href="/" className="btn btn-secondary">
          ← Terug
        </a>
      </nav>

      <section className="section">
        <span className="badge badge-success">
          ⚽ INSCHRIJVINGEN
        </span>

        <h1 style={{ fontSize: 38, fontWeight: 900, marginTop: 18 }}>
          Wie doet er mee?
        </h1>

        <p className="muted" style={{ marginTop: 10 }}>
          Bekijk de actuele inschrijvingen voor onze volgende wedstrijd.
        </p>

        {loading && <p style={{ marginTop: 30 }}>Lijst laden...</p>}

        {error && (
          <p style={{ marginTop: 30 }} role="alert">
            {error}
          </p>
        )}

        {data && !loading && (
          <>
            {data.matchday ? (
              <div className="card" style={{ marginTop: 30 }}>
                <h2 className="section-title">
                  Wedstrijd:{" "}
                  {new Date(data.matchday.match_date).toLocaleDateString(
                    "nl-BE",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC",
                    }
                  )}
                </h2>

                <p className="muted">
                  {data.players.length} ingeschreven spelers
                </p>

                <h3 style={{ marginTop: 24, marginBottom: 12 }}>
                  <span className="accent">Basisplaatsen</span> (eerste 12)
                </h3>

                {data.players.filter((p) => p.status === "basisplaats").length === 0 && (
                  <p className="muted">Nog geen spelers ingeschreven.</p>
                )}

                {data.players
                  .filter((p) => p.status === "basisplaats")
                  .map((player) => (
                    <div className="player-row" key={player.id}>
                      <span>
                        {player.position}. {player.name}
                      </span>
                      <span className="badge badge-success">
                        Basis
                      </span>
                    </div>
                  ))}

                <h3 style={{ marginTop: 28, marginBottom: 12 }}>
                  Reservelijst
                </h3>

                {data.players
                  .filter((p) => p.status === "reserve")
                  .map((player) => (
                    <div className="player-row" key={player.id}>
                      <span>
                        {player.position}. {player.name}
                      </span>
                      <span className="badge badge-reserve">
                        Reserve
                      </span>
                    </div>
                  ))}

                <p className="muted" style={{ marginTop: 24 }}>
                  De eerste 12 spelers krijgen een basisplaats. Vanaf plaats
                  13 kom je op de reservelijst.
                </p>
              </div>
            ) : (
              <div className="card" style={{ marginTop: 30 }}>
                Er is momenteel geen wedstrijd gepland.
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 24 }}>
          <a href="/inschrijven" className="btn btn-primary">
            ⚽ Schrijf je in
          </a>
        </div>
      </section>
    </main>
  );
}
