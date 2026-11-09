
"use client";

import { useState } from "react";

export default function InschrijvenPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("");
  const [cancellationUrl, setCancellationUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setCancellationUrl("");
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstName, lastName }),
      });

      const data = await response.json();
      console.log("INSCHRIJFRESULTAAT:", data);

      if (!response.ok) {
        setMessage(data.error || "Inschrijven is niet gelukt.");
        return;
      }

      setMessage(
        data.status === "basisplaats"
          ? `Je bent ingeschreven! Je staat op plaats ${data.position} en hebt een basisplaats. ⚽`
          : `Je bent ingeschreven! Je staat op plaats ${data.position} en komt op de reservelijst.`
      );

      setCancellationUrl(
        `${window.location.origin}${data.cancellationUrl}`
      );

      setFirstName("");
      setLastName("");
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
        <span className="badge badge-success">⚽ INSCHRIJVEN</span>

        <h1 style={{ fontSize: 38, fontWeight: 900, marginTop: 18 }}>
          Schrijf je in!
        </h1>

        <p className="muted" style={{ marginTop: 10, marginBottom: 28 }}>
          Vul je voornaam en achternaam in om mee te voetballen.
          De eerste 12 spelers krijgen een basisplaats.
          Vanaf plaats 13 kom je op de reservelijst.
        </p>

        <form className="card" onSubmit={handleSubmit}>
          <label htmlFor="firstName">Voornaam</label>
          <input
            id="firstName"
            type="text"
            placeholder="Jouw voornaam"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            maxLength={100}
            required
            style={{ marginTop: 8, marginBottom: 20 }}
          />

          <label htmlFor="lastName">Achternaam</label>
          <input
            id="lastName"
            type="text"
            placeholder="Jouw achternaam"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            maxLength={100}
            required
            style={{ marginTop: 8, marginBottom: 24 }}
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Bezig met inschrijven..." : "Bevestig inschrijving"}
          </button>

          {message && (
            <p role="status" style={{ marginTop: 20, fontWeight: 700 }}>
              {message}
            </p>
          )}

          {cancellationUrl && (
            <div style={{ marginTop: 24 }}>
              <p style={{ fontWeight: 700 }}>
                Bewaar deze persoonlijke uitschrijflink:
              </p>

              <input
                type="text"
                readOnly
                value={cancellationUrl}
                onClick={(event) => event.currentTarget.select()}
                style={{ marginTop: 10 }}
              />

              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: "100%", marginTop: 10 }}
                onClick={() =>
                  navigator.clipboard.writeText(cancellationUrl)
                }
              >
                Kopieer mijn uitschrijflink
              </button>

              <p className="muted" style={{ marginTop: 10 }}>
                Bewaar deze link goed. Iedereen met deze link kan jouw
                inschrijving annuleren.
              </p>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}
