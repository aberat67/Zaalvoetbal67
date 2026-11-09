
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function UitschrijvenPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  async function handleCancel() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Uitschrijven is niet gelukt.");
        return;
      }

      setMessage("Je bent succesvol uitgeschreven. ⚽");
      setFinished(true);
    } catch {
      setMessage("Er ging iets mis. Probeer opnieuw.");
    } finally {
      setLoading(false);
    }
  }

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

      <section className="section" style={{ maxWidth: 600, margin: "auto" }}>
        <span className="badge badge-success">⚽ UITSCHRIJVEN</span>

        <h1 style={{ fontSize: 38, fontWeight: 900, marginTop: 18 }}>
          Wil je je uitschrijven?
        </h1>

        <p className="muted" style={{ marginTop: 10, marginBottom: 28 }}>
          Als je bevestigt, word je verwijderd van de inschrijflijst voor deze
          wedstrijd.
        </p>

        <div className="card">
          {!finished && (
            <button
              className="btn btn-primary"
              onClick={handleCancel}
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? "Bezig..." : "Ja, schrijf mij uit"}
            </button>
          )}

          {message && (
            <p role="status" style={{ marginTop: 20, fontWeight: 700 }}>
              {message}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
