import './About.css'

function About() {
  return (
    <section id="about" aria-label="About LowXena Card Game">
      <div className="about-container">

        {/* Section Header */}
        <div className="about-header">
          <div className="about-suits-deco">♠ ♥ ♦ ♣</div>
          <h2>About LowXena</h2>
          <p className="about-tagline">
            Cards. Chaos. <em>Carry Rewards.</em> — Your new favorite 15-minute escape.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="about-grid">

          {/* Card 1: What is LowXena */}
          <div className="about-card">
            <div className="card-icon card-icon-game">🃏</div>
            <h3>What is LowXena?</h3>
            <p>
              LowXena is a hilarious, fast-paced online card game built for laughs and quick fun.
              Each session wraps up in under 15 minutes — perfect for a break, a commute, or just
              killing time with style. No long tutorials, no complicated rules — just pick up and play.
            </p>
          </div>

          {/* Card 2: Game Modes */}
          <div className="about-card">
            <div className="card-icon card-icon-modes">⚔️</div>
            <h3>Solo & Multiplayer Modes</h3>
            <p>
              Go head-to-head with friends in real-time multiplayer rooms, or sharpen your skills
              solo against smart AI opponents. Create private rooms with custom rules or jump into
              Quick Match for instant action. Up to 4 players per game.
            </p>
          </div>

          {/* Card 3: Rewards System */}
          <div className="about-card">
            <div className="card-icon card-icon-rewards">🏆</div>
            <h3>Rewards That Actually Stay</h3>
            <p>
              Earn in-game rewards as you play — and keep them forever with our{' '}
              <strong>Carry Rewards</strong> system. Your progress persists across sessions,
              so every game matters. Climb the global leaderboard and flex your win streak.
            </p>
          </div>

          {/* Card 4: Quick & Casual */}
          <div className="about-card">
            <div className="card-icon card-icon-quick">⚡</div>
            <h3>Quick, Casual, No Strings</h3>
            <p>
              No downloads. No installs. No 3-hour gaming marathons required. LowXena runs right
              in your browser on any device. Jump in for a quick round, have a laugh, and get on
              with your day. It's the ultimate casual timepass.
            </p>
          </div>

        </div>

        {/* Why Play Banner */}
        <div className="about-why">
          <h3>Why Players Choose LowXena</h3>
          <p>
            Because sometimes you just want a game that's{' '}
            <span className="highlight">fun without the commitment</span>.
            LowXena was built for real people who want real laughs — not grind-heavy
            progression or pay-to-win mechanics. It's free, it's fast, it's funny, and your{' '}
            <span className="highlight">rewards carry over</span> every time you come back.
            What's not to love?
          </p>
        </div>

        {/* Developer Credit */}
        <div className="about-dev">
          <div className="about-dev-avatar">D</div>
          <div className="about-dev-info">
            <span className="dev-label">Created by</span>
            <p className="dev-name">Dharmik Gohil</p>
            <a
              href="https://dharmikgohil.art"
              target="_blank"
              rel="noopener noreferrer"
              className="dev-portfolio"
            >
              dharmikgohil.art
            </a>
          </div>
          <p className="about-dev-heart">
            Made with <span>❤️</span> by Dharmik Gohil —{' '}
            <a
              href="https://dharmikgohil.art"
              target="_blank"
              rel="noopener noreferrer"
              className="dev-portfolio-inline"
            >
              dharmikgohil.art
            </a>
          </p>
        </div>

      </div>
    </section>
  )
}

export default About
