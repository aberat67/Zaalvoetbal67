
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

  async function movePlayer(targetTeam: number | null) {
    const destination =
      targetTeam === null ? "de reservebank" : `Team ${targetTeam}`;

    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const response = await fetch("/api/admin/teams/move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId,
          targetTeam,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verplaatsen mislukt.");
      }

      setMessage(`Verplaatst naar ${destination}.`);
      onMoved();
    } catch (err) {
      setError(true);
      setMessage(
        err instanceof Error
          ? err.message
          : "Er is iets misgegaan."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
      {currentTeam !== 1 && (
        <button
          className="btn btn-secondary"
          disabled={loading}
          onClick={() => movePlayer(1)}
        >
          Naar team 1
        </button>
      )}

      {currentTeam !== 2 && (
        <button
          className="btn btn-secondary"
          disabled={loading}
          onClick={() => movePlayer(2)}
        >
          Naar team 2
        </button>
      )}

      {currentTeam !== null && (
        <button
          className="btn btn-secondary"
          disabled={loading}
          onClick={() => movePlayer(null)}
        >
          Naar reserve
        </button>
      )}

      {loading && <span className="muted">Bezig...</span>}

      {message && (
        <span
          role="status"
          style={{ color: error ? "#ff7777" : "#75d99a" }}
        >
          {message}
        </span>
      )}
    </div>
  );
}

