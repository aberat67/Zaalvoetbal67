
"use client";

import { useState } from "react";

export default function DrawTeamsButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function drawTeams() {
    const confirmed = window.confirm(
      "Weet je zeker dat je de teams opnieuw wilt loten? De huidige teamindeling wordt vervangen."
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const response = await fetch("/api/admin/teams/draw", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "De loting is mislukt.");
      }

      setMessage("De teams zijn succesvol geloot! ⚽");
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
    <div style={{ marginTop: 18 }}>
      <button
        className="btn btn-primary"
        onClick={drawTeams}
        disabled={loading}
      >
        {loading ? "Teams loten..." : "🎲 Loot de teams"}
      </button>

      {message && (
        <p
          role="status"
          style={{
            marginTop: 14,
            color: error ? "#ff7777" : "#75d99a",
          }}
        >
          {message}
        </p>
      )}

      {message && !error && (
        <p style={{ marginTop: 10 }}>
          <a href="/teams" className="btn btn-secondary">
            Bekijk de teams
          </a>
        </p>
      )}
    </div>
  );
}
