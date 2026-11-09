
export default function Home() {
  return (
    <main>
      <nav className="container navbar">
        <a href="/" className="logo">
          ZAAL<span>VOETBAL.</span>
        </a>

        <a href="#inschrijven" className="btn btn-secondary">
          Inschrijven
        </a>
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

          <a href="#inschrijven" className="btn btn-primary">
            Bekijk inschrijvingen →
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
            De datum en locatie worden binnenkort bekendgemaakt.
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
        </div>
      </section>

      <section id="inschrijven" className="container section">
        <h2 className="section-title">Inschrijven</h2>

        <div className="card">
          <h3 style={{ fontSize: 22 }}>Speel mee!</h3>

          <p className="muted" style={{ marginTop: 10 }}>
            Binnenkort kan je je hier inschrijven voor de volgende
            zaalvoetbalwedstrijd. De eerste 12 spelers krijgen een
            basisplaats. Daarna kom je op de reservelijst.
          </p>

          <p className="accent" style={{ marginTop: 20, fontWeight: 700 }}>
            Inschrijvingen worden binnenkort geopend.
          </p>
        </div>
      </section>

      <section id="teams" className="container section">
        <h2 className="section-title">De teams</h2>

        <div className="grid">
          <div className="card">
            <span className="badge badge-success">TEAM 1</span>
            <h3 style={{ marginTop: 14 }}>Team Groen</h3>
            <p className="muted" style={{ marginTop: 8 }}>
              De spelers worden verdeeld zodra de inschrijvingen
              gesloten zijn.
            </p>
          </div>

          <div className="card">
            <span className="badge badge-reserve">TEAM 2</span>
            <h3 style={{ marginTop: 14 }}>Team Zwart</h3>
            <p className="muted" style={{ marginTop: 8 }}>
              De teams worden willekeurig samengesteld.
            </p>
          </div>
        </div>
      </section>

      <section id="statistieken" className="container section">
        <h2 className="section-title">Statistieken</h2>

        <div className="grid">
          <div className="card">
            <h3 className="accent">Topscorers</h3>
            <p className="muted" style={{ marginTop: 8 }}>
              Wie scoort dit seizoen de meeste doelpunten?
            </p>
          </div>

          <div className="card">
            <h3 className="accent">Meeste overwinningen</h3>
            <p className="muted" style={{ marginTop: 8 }}>
              Ontdek wie bovenaan staat in het klassement.
            </p>
          </div>
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
