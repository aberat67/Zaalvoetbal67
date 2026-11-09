
"use client";

import { useEffect, useState, useCallback } from "react";
import MovePlayerButton from "./MovePlayerButton";

type Player = {
  id: number;
  name: string;
  position: number;
  team: number | null;
};

export default function ManageTeams() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPlayers = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/admin/teams/players", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Spelers ophalen mislukt.");
      }

      setPlayers(data.players || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "De spelers konden niet worden geladen."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const team1 = players.filter((player) => player.team === 1);
  const team2 = players.filter((player) => player.team === 2);
  const reserves = players.filter((player) => player.team === null);

  function PlayerCard({
    player,
  }: {
    player: Player;
  }) {
    return (
      <div className="player-row" key={player.id}>
        <div>
          <strong>{player.name}</strong>
          <p className="muted">
            Inschrijfpositie: {player.position}
          </p>
        </div>

        <MovePlayerButton
          playerId={player.id}
          currentTeam={player.team}
          onMoved={loadPlayers}
        />
      </div>
    );
  }

  return (
    <section className="section">
      <h2 className="section-title">Teams beheren</h2>

      <p className="muted">
        Verplaats spelers tussen de teams en de reservebank.
      </p>

      {loading && <p>Spelers laden...</p>}

      {error && (
        <p role="alert" style={{ color: "#ff7777" }}>
          {error}
        </p>
      )}

      {!loading && !error && players.length === 0 && (
        <div className="card">
          Er zijn nog geen spelers ingeschreven.
        </div>
      )}

      {!loading && !error && players.length > 0 && (
        <div className="grid" style={{ marginTop: 24 }}>
          <div className="card">
            <h2 className="section-title">Team 1</h2>
            <p className="muted">
              {team1.length} van de 6 spelers
            </p>

            {team1.length === 0 ? (
              <p className="muted">Nog geen spelers.</p>
            ) : (
              team1.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))
            )}
          </div>

          <div className="card">
            <h2 className="section-title">Team 2</h2>
            <p className="muted">
              {team2.length} van de 6 spelers
            </p>

            {team2.length === 0 ? (
              <p className="muted">Nog geen spelers.</p>
            ) : (
              team2.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))
            )}
          </div>

          <div className="card">
            <h2 className="section-title">Reservebank</h2>
            <p className="muted">
              {reserves.length} reserves
            </p>

            {reserves.length === 0 ? (
              <p className="muted">Er zijn geen reserves.</p>
            ) : (
              reserves.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))
            )}
          </div>
        </div>
      )}

      <button
        className="btn btn-secondary"
        onClick={loadPlayers}
        disabled={loading}
        style={{ marginTop: 20 }}
      >
        Vernieuw spelerslijst
      </button>
    </section>
  );
}
