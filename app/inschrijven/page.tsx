
"use client";

import { useEffect, useState } from "react";

type Player = {
  id: number;
  firstName: string;
  lastName: string;
};

type Match = {
  date: string;
  location: string | null;
  registrationOpen: boolean;
};

export default function InschrijvenPage() {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("");
  const [cancellationUrl, setCancellationUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [match, setMatch] = useState<Match | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(true);

  useEffect(() => {
    async function loadPlayers() {
      try {
        const response = await fetch("/api/register");
        const data = await response.json();

        if (!response.ok) {
          setMessage(data.error || "Spelerslijst laden is niet gelukt.");
          return;
        }

        setPlayers(data.players || []);
      } catch {
        setMessage("De spelerslijst kon niet worden geladen.");
      } finally {
        setLoadingPlayers(false);
      }
    }

    async function loadMatch() {
      try {
        const response = await fetch("/api/next-match");
        const data = await response.json();

        if (response.ok) {
          setMatch(data.match || null);
        }
      } catch (error) {
        console.error("Wedstrijd ophalen mislukt:", error);
      } finally {
        setLoadingMatch(false);
      }
    }

    loadPlayers();
    loadMatch();
  }, []);

  const formattedDate = match?.date
    ? new Date(`${match.date.slice(0, 10)}T12:00:00`).toLocaleDateString(
        "nl-BE",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      )
    : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setCancellationUrl("");

    if (!match) {
      setMessage("Er staat momenteel geen wedstrijd gepland.");
      return;
    }

    if (!match.registrationOpen) {
      setMessage("De inschrijvingen voor deze wedstrijd zijn gesloten.");
      return;
    }

    if (mode === "existing" && !playerId) {
      setMessage("Selecteer eerst je naam.");
      return;
    }

    setLoading(true);

    try {
      const body =
        mode === "existing"
          ? { playerId: Number(playerId) }
          : { firstName, lastName };

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.existingPlayer) {
          const existing = data.existingPlayer as Player;

          setPlayers((current) =>
            current.some((player) => player.id === existing.id)
              ? current
              : [...current, existing].sort((a, b) =>
                  a.firstName.localeCompare(b.firstName)
                )
          );

          setPlayerId(String(existing.id));
          setMode("existing");
          setMessage(
            `Er bestaat al een speler met deze naam: ${existing.firstName} ${existing.lastName}. Je naam is geselecteerd. Klik nogmaals op bevestigen om met dit profiel in te schrijven.`
          );
          return;
        }

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
      setPlayerId("");
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

        <div
          className="card"
          style={{ marginTop: 18, marginBottom: 24 }}
        >
          <p className="muted" style={{ fontWeight: 700 }}>
            Je schrijft je in voor de volgende speeldag:
          </p>

          {loadingMatch ? (
            <p style={{ marginTop: 8 }}>Wedstrijddatum laden...</p>
          ) : formattedDate ? (
            <>
              <h2
                className="accent"
                style={{ fontSize: 24, marginTop: 8, textTransform: "capitalize" }}
              >
                {formattedDate}
              </h2>
              {match?.location && (
                <p className="muted" style={{ marginTop: 6 }}>
                  {match.location}
                </p>
              )}
              {!match?.registrationOpen && (
                <p style={{ marginTop: 10, fontWeight: 700 }}>
                  De inschrijvingen voor deze wedstrijd zijn gesloten.
                </p>
              )}
            </>
          ) : (
            <p style={{ marginTop: 8, fontWeight: 700 }}>
              Er staat momenteel nog geen volgende speeldag gepland.
            </p>
          )}
        </div>

        <p className="muted" style={{ marginTop: 10, marginBottom: 28 }}>
          De eerste 12 spelers krijgen een basisplaats.
          Vanaf plaats 13 kom je op de reservelijst.
        </p>

        <form className="card" onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <button
              type="button"
              className={`btn ${mode === "existing" ? "btn-primary" : "btn-secondary"}`}
              style={{ flex: 1 }}
              onClick={() => {
                setMode("existing");
                setMessage("");
              }}
            >
              Bestaande speler
            </button>

            <button
              type="button"
              className={`btn ${mode === "new" ? "btn-primary" : "btn-secondary"}`}
              style={{ flex: 1 }}
              onClick={() => {
                setMode("new");
                setMessage("");
              }}
            >
              Nieuwe speler
            </button>
          </div>

          {mode === "existing" ? (
            <>
              <label htmlFor="player">Selecteer je naam</label>

              <select
                id="player"
                value={playerId}
                onChange={(event) => setPlayerId(event.target.value)}
                required
                disabled={loadingPlayers || players.length === 0}
                style={{ marginTop: 8, marginBottom: 20, width: "100%" }}
              >
                <option value="">
                  {loadingPlayers
                    ? "Spelers laden..."
                    : players.length === 0
                      ? "Nog geen spelers beschikbaar"
                      : "Kies je naam"}
                </option>

                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.firstName} {player.lastName}
                  </option>
                ))}
              </select>

              {players.length === 0 && !loadingPlayers && (
                <p className="muted" style={{ marginBottom: 20 }}>
                  Nog geen bestaande spelers? Kies hierboven Nieuwe speler.
                </p>
              )}
            </>
          ) : (
            <>
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
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              loading ||
              loadingPlayers ||
              loadingMatch ||
              !match ||
              !match.registrationOpen
            }
            style={{ width: "100%" }}
          >
            {loading
              ? "Bezig met inschrijven..."
              : "Bevestig inschrijving"}
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
