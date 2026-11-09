
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

  function PlayerCard({ player }: { player: Player }) {
    return (
      <div
        key={player.id}
        style={{
          padding: "12px 0",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <strong>{player.name}</strong>
        <p className="muted" style={{ fontSize: 12, marginTop: 3 }}>
          Inschrijfpositie: {player.position}
        </p>

        <MovePlayerButton
          playerId={player.id}
          currentTeam={player.team}
          onMoved={loadPlayers}
        />
      </div>
    );
  }

  function TeamCard({
    title,
    list,
    color,
  }: {
    title: string;
    list: Player[];
    color: string;
  }) {
    return (
      <div className="card" style={{ padding: 18 }}>
        <h2 style={{ fontSize: 20, marginBottom: 5, color }}>
          {title}
        </h2>

        <p className="muted" style={{ fontSize: 13 }}>
          {list.length} van de 6 spelers
        </p>

        {list.length === 0 ? (
          <p className="muted" style={{ marginTop: 12 }}>
            Nog geen spelers.
          </p>
        ) : (
          list.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))
        )}
      </div>
    );
  }

  return (
    <section className="section" style={{ marginTop: 25 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: 25, fontWeight: 800 }}>
            Teams beheren
          </h2>
          <p className="muted" style={{ fontSize: 13 }}>
            Spelers verplaatsen en teams aanpassen.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={loadPlayers}
          disabled={loading}
        >
          Vernieuwen
        </button>
      </div>

      {loading && <p>Spelers laden...</p>}

      {error && (
        <p role="alert" style={{ color: "#ff7777" }}>
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            <TeamCard
              title="Team 1"
              list={team1}
              color="#75d99a"
            />

            <TeamCard
              title="Team 2"
              list={team2}
              color="#75b8ff"
            />
          </div>

          <div className="card" style={{ padding: 18, marginTop: 16 }}>
            <h2 style={{ fontSize: 20, marginBottom: 5 }}>
              Reservebank
            </h2>

            <p className="muted" style={{ fontSize: 13 }}>
              {reserves.length} reserves
            </p>

            {reserves.length === 0 ? (
              <p className="muted" style={{ marginTop: 12 }}>
                Er zijn geen reserves.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 14,
                }}
              >
                {reserves.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
