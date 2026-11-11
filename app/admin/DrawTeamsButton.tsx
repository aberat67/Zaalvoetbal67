
"use client";

import { useState } from "react";

export default function DrawTeamsButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [numberOfPlayers, setNumberOfPlayers] = useState("12");

  async function drawTeams() {
    const count = Number(numberOfPlayers);

    const confirmed = window.confirm(
      `Weet je zeker dat je ${count} spelers opnieuw wilt loten? De huidige teamindeling wordt vervangen.`
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const response = await fetch("/api/admin/teams/draw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numberOfPlayers: count,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "De loting is mislukt.");
      }

      setMessage(
        `Gelukt! Team 1 heeft ${data.team1Players} spelers en Team 2 heeft ${data.team2Players} spelers. ⚽`
      );
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
      <label htmlFor="numberOfPlayers">
        Hoeveel spelers spelen deze wedstrijd?
      </label>

      <select
        id="numberOfPlayers"
        value={numberOfPlayers}
        onChange={(event) => setNumberOfPlayers(event.target.value)}
        disabled={loading}
        style={{
          display: "block",
          width: "100%",
          marginTop: 8,
          marginBottom: 16,
          padding: 12,
          borderRadius: 8,
        }}
      >
        <option value="12">12 spelers (6 tegen 6)</option>
        <option value="13">13 spelers (7 tegen 6)</option>
        <option value="14">14 spelers (7 tegen 7)</option>
      </select>

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
