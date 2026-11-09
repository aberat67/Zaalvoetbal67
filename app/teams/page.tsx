
"use client";

import { useEffect, useState } from "react";

type TeamPlayer = {
  id: number;
  name: string;
};

type Team = {
  team_number: number;
  players: TeamPlayer[];
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTeams() {
    try {
      const response = await fetch("/api/teams");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Teams ophalen mislukt.");
      }

      setTeams(data.teams || []);
    } catch {
      setError("De teams konden niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeams();
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
        <span className="badge badge-success">⚽ TEAMVERDELING</span>

        <h1 style={{ fontSize: 38, fontWeight: 900, marginTop: 18 }}>
          Onze teams
        </h1>

        <p className="muted" style={{ marginTop: 10 }}>
          Bekijk wie er in Team 1 en Team 2 speelt.
        </p>

        {loading && <p style={{ marginTop: 30 }}>Teams laden...</p>}

        {error && (
          <p role="alert" style={{ marginTop: 30 }}>
            {error}
          </p>
        )}

        {!loading && !error && teams.length === 0 && (
          <div className="card" style={{ marginTop: 30 }}>
            Er zijn nog geen teams verdeeld.
          </div>
        )}

        {!loading && !error && (
          <div className="grid" style={{ marginTop: 30 }}>
            {[1, 2].map((number) => {
              const team = teams.find(
                (item) => item.team_number === number
              );

              return (
                <div className="card" key={number}>
                  <h2 className="section-title">
                    Team {number}
                  </h2>

                  {!team || team.players.length === 0 ? (
                    <p className="muted">Nog geen spelers.</p>
                  ) : (
                    team.players.map((player, index) => (
                      <div className="player-row" key={player.id}>
                        <span>
                          {index + 1}. {player.name}
                        </span>
                      </div>
                    ))
                  )}

                  <p className="muted" style={{ marginTop: 16 }}>
                    {team?.players.length || 0} spelers
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
