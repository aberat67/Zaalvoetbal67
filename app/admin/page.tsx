
export default function AdminPage() {
  return (
    <main className="container">
      <nav className="navbar">
        <a href="/" className="logo">
          ZAAL<span>VOETBAL.</span>
        </a>

        <a href="/" className="btn btn-secondary">
          ← Terug naar website
        </a>
      </nav>

      <section className="section">
        <span className="badge badge-success">
          BEHEER
        </span>

        <h1
          style={{
            fontSize: 38,
            fontWeight: 900,
            marginTop: 16,
          }}
        >
          Beheerderspaneel
        </h1>

        <p className="muted" style={{ marginTop: 8 }}>
          Beheer hier straks alle onderdelen van jouw zaalvoetbal.
        </p>
      </section>

      <section className="grid section">
        <div className="card">
          <h2>👥 Spelers</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Spelers toevoegen, aanpassen en verwijderen.
          </p>
        </div>

        <div className="card">
          <h2>📝 Inschrijvingen</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Inschrijvingen openen, sluiten en beheren.
          </p>
        </div>

        <div className="card">
          <h2>⚽ Teams</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Teams verdelen en spelers verplaatsen.
          </p>
        </div>

        <div className="card">
          <h2>🏆 Wedstrijden</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Uitslagen, doelpunten en assists invoeren.
          </p>
        </div>

        <div className="card">
          <h2>📊 Statistieken</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Klassementen en spelersstatistieken bekijken.
          </p>
        </div>
      </section>

      <p className="muted" style={{ paddingBottom: 40 }}>
        Dit is voorlopig de visuele basis. De beveiliging en
        beheerfuncties bouwen we hierna.
      </p>
    </main>
  );
}
