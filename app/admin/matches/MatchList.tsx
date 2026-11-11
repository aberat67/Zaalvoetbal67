
"use client";

import { useCallback, useEffect, useState } from "react";

type Match = {
  id: number;
  match_date: string;
  location: string | null;
  registration_open: boolean;
  team1_score: number | null;
  team2_score: number | null;
  played_at: string | null;
};

export default function MatchList() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadMatches = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/admin/matches/list", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Wedstrijden ophalen mislukt.");
      }

      setMatches(data.matches || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Wedstrijden konden niet worden geladen."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  async function toggleRegistration(match: Match) {
    const newStatus = !match.registration_open;

    try {
      setUpdatingId(match.id);
      setError("");

      const response = await fetch(
        "/api/admin/matches/registration",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            matchdayId: match.id,
            registrationOpen: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Inschrijvingen aanpassen mislukt."
        );
      }

      setMatches((currentMatches) =>
        currentMatches.map((item) =>
          item.id === match.id
            ? {
                ...item,
                registration_open: data.registrationOpen,
              }
            : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Inschrijvingen aanpassen mislukt."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteMatch(match: Match) {
    const confirmed = window.confirm(
      `LET OP! Wil je de wedstrijd van ${formatDate(match.match_date)} definitief verwijderen? Alle inschrijvingen, teams, uitslag en statistieken van deze wedstrijddag worden verwijderd.`
    );

    if (!confirmed) return;

    const secondConfirmation = window.confirm(
      "Weet je het zeker? Deze actie kan niet ongedaan worden gemaakt."
    );

    if (!secondConfirmation) return;

    try {
      setUpdatingId(match.id);
      setError("");

      const response = await fetch("/api/admin/matches/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchdayId: match.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Wedstrijd verwijderen mislukt.");
      }

      setMatches((currentMatches) =>
        currentMatches.filter((item) => item.id !== match.id)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Wedstrijd verwijderen mislukt."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function formatDate(date: string) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <h2>Alle wedstrijden</h2>

        <button
          className="btn btn-secondary"
          onClick={loadMatches}
          disabled={loading || updatingId !== null}
        >
          Vernieuwen
        </button>
      </div>

      {loading && <p>Wedstrijden laden...</p>}

      {error && (
        <p role="alert" style={{ color: "#ff7777" }}>
          {error}
        </p>
      )}

      {!loading && !error && matches.length === 0 && (
        <p className="muted">
          Er zijn nog geen wedstrijden aangemaakt.
        </p>
      )}

      {!loading &&
        matches.map((match) => (
          <div
            className="player-row"
            key={match.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
              padding: "16px 0",
            }}
          >
            <div>
              <strong>{formatDate(match.match_date)}</strong>

              <p className="muted" style={{ marginTop: 5 }}>
                {match.location || "Geen locatie opgegeven"}
              </p>

              <span
                className={
                  match.registration_open
                    ? "badge badge-success"
                    : "badge"
                }
              >
                {match.registration_open
                  ? "Inschrijving open"
                  : "Inschrijving gesloten"}
              </span>

              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <button
                  className={
                    match.registration_open
                      ? "btn btn-secondary"
                      : "btn btn-primary"
                  }
                  onClick={() => toggleRegistration(match)}
                  disabled={updatingId !== null}
                >
                  {updatingId === match.id
                    ? "Bezig..."
                    : match.registration_open
                      ? "Inschrijving sluiten"
                      : "Inschrijving openen"}
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => deleteMatch(match)}
                  disabled={updatingId !== null}
                  style={{ color: "#ff7777" }}
                >
                  Wedstrijd verwijderen
                </button>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              {match.played_at ? (
                <>
                  <strong style={{ fontSize: 22 }}>
                    {match.team1_score} - {match.team2_score}
                  </strong>
                  <p className="muted">Eindstand</p>
                </>
              ) : (
                <span className="muted">Nog niet gespeeld</span>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
