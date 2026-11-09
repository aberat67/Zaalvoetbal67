
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Inloggen mislukt.");
        return;
      }

      router.push("/admin");
      router.refresh();
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

      <section
        className="section"
        style={{ maxWidth: 500, margin: "auto" }}
      >
        <span className="badge badge-success">BEHEERDERSLOGIN</span>

        <h1 style={{ fontSize: 38, fontWeight: 900, marginTop: 18 }}>
          Welkom terug!
        </h1>

        <p className="muted" style={{ marginTop: 10, marginBottom: 28 }}>
          Log in om de zaalvoetbalwebsite te beheren.
        </p>

        <form className="card" onSubmit={handleLogin}>
          <label htmlFor="password">Beheerderswachtwoord</label>

          <input
            id="password"
            type="password"
            placeholder="Vul je wachtwoord in"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            style={{ marginTop: 8, marginBottom: 20 }}
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Bezig met inloggen..." : "Inloggen"}
          </button>

          {message && (
            <p role="alert" style={{ marginTop: 20, fontWeight: 700 }}>
              {message}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
