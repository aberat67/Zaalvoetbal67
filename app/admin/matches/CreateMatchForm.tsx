"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateMatchForm() {
  const router = useRouter();

  const [matchDate, setMatchDate] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function createMatch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const response = await fetch("/api/admin/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchDate,
          location,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Wedstrijd aanmaken mislukt.");
      }

      setMessage("De wedstrijd is succesvol aangemaakt!");
      setMatchDate("");
      setLocation("");
      router.refresh();
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
    <form onSubmit={createMatch}>
      <div style={{ marginTop: 18 }}>
        <label htmlFor="matchDate">Wedstrijddatum</label>
        <input
          id="matchDate"
          type="date"
          value={matchDate}
          onChange={(event) => setMatchDate(event.target.value)}
          required
          style={{ display: "block", width: "100%", marginTop: 8 }}
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <label htmlFor="location">Locatie (optioneel)</label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Bijvoorbeeld Sporthal Genk"
          maxLength={200}
          style={{ display: "block", width: "100%", marginTop: 8 }}
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
        style={{ marginTop: 20 }}
      >
        {loading ? "Bezig..." : "Wedstrijd aanmaken"}
      </button>

      {message && (
        <p
          role="status"
          style={{
            marginTop: 15,
            color: error ? "#ff7777" : "#75d99a",
          }}
        >
          {message}
        </p>
      )}
    </form>
  );
}
