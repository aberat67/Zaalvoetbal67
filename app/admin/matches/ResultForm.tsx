"use client";

import { useEffect, useState } from "react";

type Match = {
  id: number;
  match_date: string;
  location: string | null;
  team1_score: number | null;
  team2_score: number | null;
  played_at: string | null;
};

type Player = {
  id: number;
  name: string;
  team: number;
};

type PlayerStat = {
  playerId: number;
  teamNumber: number;
  goals: number;
  assists: number;
};

export default function ResultForm() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchId, setMatchId] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [team1Score, setTeam1Score] = useState("0");
  const [team2Score, setTeam2Score] = useState("0");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadMatches() {
      try {
        const response = await fetch("/api/admin/matches/list", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Wedstrijden laden mislukt.");
        }

        setMatches(data.matches || []);
      } catch {
        setError(true);
        setMessage("Wedstrijden konden niet worden geladen.");
      }
    }

    loadMatches();
  }, []);

  useEffect(() => {
    if (!matchId) {
      setPlayers([]);
      setStats([]);
      return;
    }

    async function loadPlayers() {
      setLoading(true);
      setMessage("");

      try {
        const response = await fetch(
          `/api/admin/matches/${matchId}/players`,
          { cache: "no-store" }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Spelers laden mislukt.");
        }

        setPlayers(data.players || []);
        setStats(
          (data.players || []).map((player: Player) => ({
            playerId: player.id,
            teamNumber: player.team,
            goals: 0,
            assists: 0,
          }))
        );
        setTeam1Score("0");
        setTeam2Score("0");
      } catch {
        setError(true);
        setMessage("Spelers konden niet worden geladen.");
      } finally {
        setLoading(false);
      }
    }

    loadPlayers();
  }, [matchId]);

  function updateStat(
    playerId: number,
    field: "goals" | "assists",
    value: string
  ) {
    const amount = Math.max(0, Math.min(50, Number(value) || 0));

    setStats((current) =>
      current.map((stat) =>
        stat.playerId === playerId
          ? { ...stat, [field]: amount }
          : stat
      )
    );
  }

  const goals1 = stats
    .filter((stat) => stat.teamNumber === 1)
    .reduce((sum, stat) => sum + stat.goals, 0);

  const goals2 = stats
    .filter((stat) => stat.teamNumber === 2)
    .reduce((sum, stat) => sum + stat.goals, 0);

  async function saveResult(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!matchId) return;

    if (
      Number(team1Score) !== goals1 ||
      Number(team2Score) !== goals2
    ) {
      setError(true);
      setMessage(
        "De doelpunten van de spelers moeten overeenkomen met de eindstand."
      );
      return;
    }

    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const response = await fetch("/api/admin/matches/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchdayId: Number(matchId),
          team1Score: Number(team1Score),
          team2Score: Number(team2Score),
          stats,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Uitslag opslaan mislukt.");
      }

      setMessage("Uitslag en spelersstatistieken opgeslagen!");
    } catch (err) {
      setError(true);
      setMessage(
        err instanceof Error
          ? err.message
          : "De uitslag kon niet worden opgeslagen."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={saveResult}>
      <div style={{ marginTop: 18 }}>
        <label htmlFor="match">Selecteer wedstrijd</label>
        <select
          id="match"
          value={matchId}
          onChange={(event) => setMatchId(event.target.value)}
          required
          style={{ display: "block", width: "100%", marginTop: 8 }}
        >
          <option value="">Kies een wedstrijd</option>
          {matches.map((match) => (
            <option key={match.id} value={match.id}>
              {match.match_date} {match.location ? `- ${match.location}` : ""}
            </option>
          ))}
        </select>
      </div>

      {matchId && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginTop: 22,
            }}
          >
            <div>
              <label htmlFor="score1">Score Team 1</label>
              <input
                id="score1"
                type="number"
                min="0"
                max="50"
                value={team1Score}
                onChange={(event) => setTeam1Score(event.target.value)}
                required
              />
              <p className="muted" style={{ marginTop: 5 }}>
                Geregistreerd: {goals1} doelpunten
              </p>
            </div>

            <div>
              <label htmlFor="score2">Score Team 2</label>
              <input
                id="score2"
                type="number"
                min="0"
                max="50"
                value={team2Score}
                onChange={(event) => setTeam2Score(event.target.value)}
                required
              />
              <p className="muted" style={{ marginTop: 5 }}>
                Geregistreerd: {goals2} doelpunten
              </p>
            </div>
          </div>

          <h3 style={{ marginTop: 28, marginBottom: 14 }}>
            Doelpunten en assists
          </h3>

          {loading && <p>Spelers laden...</p>}

          {[1, 2].map((teamNumber) => (
            <div key={teamNumber} style={{ marginTop: 20 }}>
              <h3>Team {teamNumber}</h3>

              {players
                .filter((player) => player.team === teamNumber)
                .map((player) => {
                  const stat = stats.find(
                    (item) => item.playerId === player.id
                  );

                  if (!stat) return null;

                  return (
                    <div
                      key={player.id}
                      className="player-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 75px 75px",
                        gap: 10,
                        alignItems: "center",
                        padding: "12px 0",
                      }}
                    >
                      <strong>{player.name}</strong>

                      <div>
                        <label style={{ fontSize: 11 }}>Goals</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={stat.goals}
                          onChange={(event) =>
                            updateStat(player.id, "goals", event.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 11 }}>Assists</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={stat.assists}
                          onChange={(event) =>
                            updateStat(player.id, "assists", event.target.value)
                          }
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || players.length !== 12}
            style={{ marginTop: 24 }}
          >
            {loading ? "Bezig..." : "Uitslag opslaan"}
          </button>
        </>
      )}

      {message && (
        <p
          role="status"
          style={{
            marginTop: 16,
            color: error ? "#ff7777" : "#75d99a",
          }}
        >
          {message}
        </p>
      )}
    </form>
  );
}
