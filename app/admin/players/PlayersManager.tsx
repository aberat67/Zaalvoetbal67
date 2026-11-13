
"use client";

import { useEffect, useMemo, useState } from "react";

type Player = {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  created_at: string;
  registrations: number;
  matches: number;
};

export default function PlayersManager() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadPlayers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/players", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Spelers konden niet worden opgehaald.");
      }

      setPlayers(data.players || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlayers();
  }, []);

  const filteredPlayers = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return players;

    return players.filter((player) =>
      `${player.first_name} ${player.last_name} ${player.name}`
        .toLowerCase()
        .includes(query)
    );
  }, [players, search]);

  async function addPlayer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Speler kon niet worden toegevoegd.");
      }

      setFirstName("");
      setLastName("");
      setMessage("Speler succesvol aangemaakt.");
      await loadPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(player: Player) {
    setEditingId(player.id);
    setEditFirstName(player.first_name);
    setEditLastName(player.last_name);
    setMessage("");
    setError("");
  }

  async function savePlayer(playerId: number) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          firstName: editFirstName,
          lastName: editLastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Speler kon niet worden aangepast.");
      }

      setEditingId(null);
      setMessage("Spelersnaam succesvol aangepast.");
      await loadPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePlayer(player: Player) {
    const confirmed = window.confirm(
      `Weet je zeker dat je ${player.first_name} ${player.last_name} wilt verwijderen? Alle persoonlijke statistieken en inschrijvingen worden ook verwijderd.`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/players", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Speler kon niet worden verwijderd.");
      }

      setMessage(`${player.first_name} ${player.last_name} is verwijderd.`);
      await loadPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis.");
    }
  }

  return (
    <div style={{ marginTop: 28 }}>
      <div className="card">
        <h2>Nieuwe speler aanmaken</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          De speler wordt toegevoegd aan de spelerslijst, maar niet automatisch
          ingeschreven voor een wedstrijd.
        </p>

        <form
          onSubmit={addPlayer}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginTop: 18,
          }}
        >
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Voornaam"
            required
            className="input"
          />

          <input
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Achternaam"
            required
            className="input"
          />

          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Bezig..." : "Speler toevoegen"}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div>
            <h2>Alle spelers</h2>
            <p className="muted" style={{ marginTop: 5 }}>
              {players.length} spelers in de database
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

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Zoek op naam..."
          className="input"
          style={{ width: "100%", marginTop: 18 }}
        />

        {message && (
          <p style={{ color: "#75d99a", marginTop: 14 }}>{message}</p>
        )}

        {error && (
          <p style={{ color: "#ff7777", marginTop: 14 }}>{error}</p>
        )}

        {loading ? (
          <p className="muted" style={{ marginTop: 20 }}>
            Spelers laden...
          </p>
        ) : filteredPlayers.length === 0 ? (
          <p className="muted" style={{ marginTop: 20 }}>
            Geen spelers gevonden.
          </p>
        ) : (
          <div style={{ marginTop: 18 }}>
            {filteredPlayers.map((player) => (
              <div
                key={player.id}
                style={{
                  padding: "14px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {editingId === player.id ? (
                  <div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: 10,
                      }}
                    >
                      <input
                        className="input"
                        value={editFirstName}
                        onChange={(event) =>
                          setEditFirstName(event.target.value)
                        }
                        placeholder="Voornaam"
                      />

                      <input
                        className="input"
                        value={editLastName}
                        onChange={(event) =>
                          setEditLastName(event.target.value)
                        }
                        placeholder="Achternaam"
                      />
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                      <button
                        className="btn"
                        onClick={() => savePlayer(player.id)}
                        disabled={saving}
                      >
                        {saving ? "Bezig..." : "Opslaan"}
                      </button>

                      <button
                        className="btn btn-secondary"
                        onClick={() => setEditingId(null)}
                        disabled={saving}
                      >
                        Annuleren
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong>
                        {player.first_name} {player.last_name}
                      </strong>
                      <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                        {player.registrations} inschrijvingen · {player.matches}{" "}
                        geregistreerde wedstrijden
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => startEditing(player)}
                      >
                        Naam wijzigen
                      </button>

                      <button
                        className="btn btn-secondary"
                        onClick={() => deletePlayer(player)}
                      >
                        Verwijderen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
