
"use client";

import { useEffect, useState } from "react";

type Player = {
  id: number;
  name: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  wins: number;
  draws: number;
  losses: number;
  winPercentage: number;
};

export default function StatisticsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((response) => response.json())
      .then((data) => setPlayers(data.players || []))
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, []);

  const topScorers = [...players].sort(
    (a, b) => b.goals - a.goals || b.assists - a.assists
  );

  const mostWins = [...players].sort(
    (a, b) => b.wins - a.wins || b.winPercentage - a.winPercentage
  );

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
        <span className="badge badge-success">SEIZOENSSTATISTIEKEN</span>
        <h1>Spelersstatistieken</h1>
        <p className="muted">
          Bekijk de prestaties van alle spelers.
        </p>

        {loading ? (
          <p>Statistieken laden...</p>
        ) : (
          <>
            <div className="card" style={{ marginTop: 25 }}>
              <h2>🏆 Topscorers</h2>
              {topScorers.length === 0 ? (
                <p className="muted">Nog geen statistieken beschikbaar.</p>
              ) : (
                topScorers.map((player, index) => (
                  <div className="player-row" key={player.id}>
                    <strong>#{index + 1} {player.name}</strong>
                    <span>{player.goals} goals</span>
                  </div>
                ))
              )}
            </div>

            <div className="card" style={{ marginTop: 25 }}>
              <h2>🥇 Meeste overwinningen</h2>
              {mostWins.map((player, index) => (
                <div className="player-row" key={player.id}>
                  <strong>#{index + 1} {player.name}</strong>
                  <span>{player.wins} gewonnen</span>
                </div>
              ))}
            </div>

            <div className="card" style={{ marginTop: 25 }}>
              <h2>Alle spelers</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}>
                  <thead>
                    <tr>
                      {["Speler", "Wedstrijden", "Goals", "Assists", "W", "G", "V", "Winst %"].map((heading) => (
                        <th key={heading} style={{ padding: 12, textAlign: "left" }}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player) => (
                      <tr key={player.id}>
                        <td style={{ padding: 12 }}>{player.name}</td>
                        <td style={{ padding: 12 }}>{player.matchesPlayed}</td>
                        <td style={{ padding: 12 }}>{player.goals}</td>
                        <td style={{ padding: 12 }}>{player.assists}</td>
                        <td style={{ padding: 12 }}>{player.wins}</td>
                        <td style={{ padding: 12 }}>{player.draws}</td>
                        <td style={{ padding: 12 }}>{player.losses}</td>
                        <td style={{ padding: 12 }}>{player.winPercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
