"use client";

import { useState } from "react";

type Props = {
  playerId: number;
  currentTeam: number | null;
  onMoved: () => void;
};

export default function MovePlayerButton({
  playerId,
  currentTeam,
  onMoved,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [opponents, setOpponents] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");

  async function loadOpponents() {
    setShowSwap(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/teams/players", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Spelers ophalen mislukt.");
      }

      setOpponents(
        (data.players || []).filter(
          (player: { id: number; name: string; team: number | null }) =>
            player.team !== null &&
            player.team !== currentTeam &&
            player.id !== playerId
        )
      );
    } catch {
      setError(true);
      setMessage("De spelers konden niet worden opgehaald.");
    }
  }

  async function swapPlayers() {
    if (!selectedPlayer) return;

    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const response = await fetch("/api/admin/teams/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          otherPlayerId: Number(selectedPlayer),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Wisselen mislukt.");
      }

      setMessage("De spelers zijn gewisseld!");
      setShowSwap(false);
      setSelectedPlayer("");
      onMoved();
    } catch (err) {
      setError(true);
      setMessage(
        err instanceof Error ? err.message : "Er ging iets mis."
      );
    } finally {
      setLoading(false);
    }
  }

  async function movePlayer(targetTeam: number | null) {
    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const response = await fetch("/api/admin/teams/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, targetTeam }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verplaatsen mislukt.");
      }

      setMessage("Speler verplaatst.");
      onMoved();
    } catch (err) {
      setError(true);
      setMessage(
        err instanceof Error ? err.message : "Er ging iets mis."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
      {currentTeam !== 1 && (
        <button className="btn btn-secondary" disabled={loading}
          onClick={() => movePlayer(1)}>
          Naar team 1
        </button>
      )}

      {currentTeam !== 2 && (
        <button className="btn btn-secondary" disabled={loading}
          onClick={() => movePlayer(2)}>
          Naar team 2
        </button>
      )}

      {currentTeam !== null && (
        <button className="btn btn-secondary" disabled={loading}
          onClick={() => movePlayer(null)}>
          Naar reserve
        </button>
      )}

      {currentTeam !== null && (
        <button className="btn btn-primary" disabled={loading}
          onClick={loadOpponents}>
          Wisselen met speler
        </button>
      )}

      {showSwap && (
        <div style={{ width: "100%", marginTop: 8 }}>
          <select
            value={selectedPlayer}
            onChange={(event) => setSelectedPlayer(event.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 8 }}
          >
            <option value="">Kies een speler uit het andere team</option>
            {opponents.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>

          <button
            className="btn btn-primary"
            disabled={loading || !selectedPlayer}
            onClick={swapPlayers}
            style={{ marginTop: 8 }}
          >
            Bevestig wissel
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setShowSwap(false)}
            style={{ marginTop: 8, marginLeft: 8 }}
          >
            Annuleren
          </button>
        </div>
      )}

      {loading && <span className="muted">Bezig...</span>}

      {message && (
        <span role="status" style={{ color: error ? "#ff7777" : "#75d99a" }}>
          {message}
        </span>
      )}
    </div>
  );
}
