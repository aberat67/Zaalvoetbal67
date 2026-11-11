
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
  const [message, setMessage] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");

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

  async function addPlayer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/teams/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Speler toevoegen mislukt.");
      }

      setFirstName("");
      setLastName("");
      setMessage("Speler toegevoegd.");
      await loadPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Toevoegen mislukt.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(player: Player) {
    const parts = player.name.split(" ");
    setEditingId(player.id);
    setEditFirstName(parts.shift() || "");
    setEditLastName(parts.join(" "));
    setMessage("");
    setError("");
  }

  async function saveName(playerId: number) {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/teams/players", {
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
        throw new Error(data.error || "Naam aanpassen mislukt.");
      }

      setEditingId(null);
      setMessage("Naam aangepast.");
      await loadPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aanpassen mislukt.");
    } finally {
      setSaving(false);
    }
  }

  async function removePlayer(player: Player) {
    const confirmed = window.confirm(
      `Wil je ${player.name} verwijderen van de komende speeldag? Historische statistieken blijven bewaard.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/teams/players", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verwijderen mislukt.");
      }

      setMessage("Speler verwijderd van de komende speeldag.");
      await loadPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verwijderen mislukt.");
    }
  }

  const team1 = players.filter((player) => player.team === 1);
  const team2 = players.filter((player) => player.team === 2);
  const reserves = players.filter((player) => player.team === null);

  function PlayerCard({ player }: { player: Player }) {
    return (
      <div
        style={{
          padding: "12px 0",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {editingId === player.id ? (
          <div style={{ display: "grid", gap: 8 }}>
            <input
              value={editFirstName}
              onChange={(event) => setEditFirstName(event.target.value)}
              placeholder="Voornaam"
            />
            <input
              value={editLastName}
              onChange={(event) => setEditLastName(event.target.value)}
              placeholder="Achternaam"
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn"
                onClick={() => saveName(player.id)}
                disabled={saving}
              >
                Opslaan
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
          <>
            <strong>{player.name}</strong>
            <p className="muted" style={{ fontSize: 12, marginTop: 3 }}>
              Inschrijfpositie: {player.position}
            </p>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              <MovePlayerButton
                playerId={player.id}
                currentTeam={player.team}
                onMoved={loadPlayers}
              />
              <button
                className="btn btn-secondary"
                onClick={() => startEditing(player)}
              >
                Naam wijzigen
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => removePlayer(player)}
                style={{ color: "#ff7777" }}
              >
                Verwijderen
              </button>
            </div>
          </>
        )}
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
        <h2 style={{ fontSize: 20, marginBottom: 5, color }}>{title}</h2>
        <p className="muted" style={{ fontSize: 13 }}>
          {list.length} spelers
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
      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          Speler toevoegen
        </h2>

        <form onSubmit={addPlayer} style={{ display: "grid", gap: 10 }}>
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Voornaam"
            required
            maxLength={50}
          />
          <input
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Achternaam"
            required
            maxLength={50}
          />
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Bezig..." : "Speler toevoegen"}
          </button>
        </form>
      </div>

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
          <h2 style={{ fontSize: 25, fontWeight: 800 }}>Teams beheren</h2>
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

      {message && <p style={{ color: "#75d99a", marginBottom: 12 }}>{message}</p>}
      {error && <p role="alert" style={{ color: "#ff7777", marginBottom: 12 }}>{error}</p>}
      {loading && <p>Spelers laden...</p>}

      {!loading && !error && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            <TeamCard title="Team 1" list={team1} color="#75d99a" />
            <TeamCard title="Team 2" list={team2} color="#75b8ff" />
          </div>

          <div className="card" style={{ padding: 18, marginTop: 16 }}>
            <h2 style={{ fontSize: 20, marginBottom: 5 }}>Niet ingedeeld</h2>
            <p className="muted" style={{ fontSize: 13 }}>
              {reserves.length} spelers
            </p>

            {reserves.length === 0 ? (
              <p className="muted" style={{ marginTop: 12 }}>
                Alle spelers zijn ingedeeld.
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
