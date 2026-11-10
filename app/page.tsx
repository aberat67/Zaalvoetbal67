
export default function Home() {
  return (
    <main>
      <nav className="container navbar">
        <a href="/" className="logo">
          ZAAL<span>VOETBAL.</span>
        </a>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/inschrijven" className="btn btn-secondary">
            Inschrijven
          </a>

          <a href="/statistieken" className="btn btn-secondary">
            Statistieken
          </a>

          <a href="/teams" className="btn btn-secondary">
            Teams
          </a>
        </div>
      </nav>

      <section className="hero">
        <div className="container">
          <span className="badge badge-success">
            ⚽ HET ONLINE VOETBALPLATFORM
          </span>

          <h1>
            Samen voetballen.
            <br />
            <span className="accent">Samen winnen.</span>
          </h1>

          <p>
            Alles voor onze zaalvoetbalwedstrijden op één plek.
            Schrijf je in, ontdek de teams en volg alle statistieken.
          </p>

          <a href="/inschrijven" className="btn btn-primary">
            Schrijf je in →
          </a>
        </div>
      </section>

      <section className="container section">
        <h2 className="section-title">Volgende speeldag</h2>

        <div className="card">
          <span className="badge badge-success">BINNENKORT</span>

          <h2 style={{ marginTop: 16, fontSize: 28 }}>
            De volgende wedstrijd
          </h2>

          <p className="muted" style={{ marginTop: 8 }}>
            Bekijk de volgende speeldag en schrijf je in.
          </p>

          <div
            style={{
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              marginTop: 24,
            }}
          >
            <div>
              <p className="muted">Beschikbare plaatsen</p>
              <h2 className="accent">12 spelers</h2>
            </div>

            <div>
              <p className="muted">Reservespelers</p>
              <h2>Onbeperkt</h2>
            </div>
          </div>

          <a
            href="/inschrijven"
            className="btn btn-primary"
            style={{ marginTop: 20 }}
          >
            Inschrijven →
          </a>
        </div>
      </section>

      <section id="inschrijven" className="container section">
        <h2 className="section-title">Inschrijven</h2>

        <div className="card">
          <h3 style={{ fontSize: 22 }}>Speel mee!</h3>

          <p className="muted" style={{ marginTop: 10 }}>
            Schrijf je in voor de volgende zaalvoetbalwedstrijd.
            De eerste 12 spelers krijgen een basisplaats.
            Daarna kom je op de reservelijst.
          </p>

          <a
            href="/inschrijven"
            className="btn btn-primary"
            style={{ marginTop: 20 }}
          >
            Naar inschrijvingen →
          </a>
        </div>
      </section>

      <section id="teams" className="container section">
        <h2 className="section-title">De teams</h2>

        <div className="grid">
          <div className="card">
            <span className="badge badge-success">TEAM 1</span>
            <h3 style={{ marginTop: 14 }}>Team Wit</h3>
            <p className="muted" style={{ marginTop: 8 }}>
              Bekijk de spelers van Team 1.
            </p>
          </div>

          <div className="card">
            <span className="badge badge-reserve">TEAM 2</span>
            <h3 style={{ marginTop: 14 }}>Team Zwart</h3>
            <p className="muted" style={{ marginTop: 8 }}>
              Bekijk de spelers van Team 2.
            </p>
          </div>
        </div>

        <a
          href="/teams"
          className="btn btn-secondary"
          style={{ marginTop: 20 }}
        >
          Bekijk alle teams →
        </a>
      </section>

      <section id="statistieken" className="container section">
        <h2 className="section-title">Statistieken</h2>

        <div className="grid">
          <a href="/statistieken" className="card">
            <h3 className="accent">Topscorers</h3>
            <p className="muted" style={{ marginTop: 8 }}>
              Bekijk wie de meeste doelpunten heeft gemaakt.
            </p>
            <p style={{ marginTop: 16 }}>Bekijk klassement →</p>
          </a>

          <a href="/statistieken" className="card">
            <h3 className="accent">Meeste overwinningen</h3>
            <p className="muted" style={{ marginTop: 8 }}>
              Ontdek wie bovenaan staat in het klassement.
            </p>
            <p style={{ marginTop: 16 }}>Bekijk klassement →</p>
          </a>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Zaalvoetbal</p>
          <p>Gemaakt voor onze voetbalploeg ⚽</p>
        </div>
      </footer>
    </main>
  );
}
