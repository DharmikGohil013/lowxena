import { useNavigate } from 'react-router-dom'
import Lottie from 'lottie-react'
import { useState, useEffect } from 'react'
import './Rules.css'

function Rules() {
  const navigate = useNavigate()
  const [casinoAnimation, setCasinoAnimation] = useState(null)
  const [spinnerAnimation, setSpinnerAnimation] = useState(null)

  useEffect(() => {
    fetch('/casino-cards.json')
      .then(res => res.json())
      .then(data => setCasinoAnimation(data))
    
    fetch('/cards-spinner.json')
      .then(res => res.json())
      .then(data => setSpinnerAnimation(data))
  }, [])

  return (
    <div className="rules-container">
      <video 
        className="video-background" 
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>

      <div className="rules-content">
        {/* Header */}
        <header className="rules-header">
          <div className="header-badge">📜</div>
          <h1>LeastCount</h1>
          <p className="subtitle">Easy and fun card game for 2 or more players</p>
        </header>

        <div className="rules-body">
          {/* Objective + How to Play with animation */}
          <div className="rules-row">
            <div className="rules-col">
              <section className="rule-card objective-card">
                <div className="card-icon">🎯</div>
                <h2>Game Objective</h2>
                <p>
                  Push your opponents to reach <strong>200 points</strong> before you do. 
                  The last person to avoid reaching 200 points wins the game.
                </p>
              </section>

              <section className="rule-card">
                <div className="card-icon">🃏</div>
                <h2>How to Play</h2>
                <ol className="steps-list">
                  <li>
                    <span className="step-num">1</span>
                    <span>Each player gets <strong>7 cards</strong> from a 52-card deck <em>(hidden from opponents)</em></span>
                  </li>
                  <li>
                    <span className="step-num">2</span>
                    <span>Drop your <strong>highest value cards</strong> to keep your score low</span>
                  </li>
                  <li>
                    <span className="step-num">3</span>
                    <span>Drop a card first, then pick from <strong>open or closed deck</strong></span>
                  </li>
                  <li>
                    <span className="step-num">4</span>
                    <span>Call <strong>"Show"</strong> when you think you have the lowest total</span>
                  </li>
                </ol>
              </section>
            </div>

            <div className="rules-animation">
              {casinoAnimation && (
                <Lottie 
                  animationData={casinoAnimation} 
                  loop={true}
                  className="lottie-animation"
                />
              )}
            </div>
          </div>

          {/* Good Show vs Bad Show */}
          <section className="rule-card show-section">
            <div className="card-icon">⚖️</div>
            <h2>Good Show vs Bad Show</h2>
            <div className="show-grid">
              <div className="show-box good-show">
                <div className="show-badge good">✅ Good Show</div>
                <p className="show-desc">Caller has the <strong>lowest total</strong> among all players</p>
                <div className="show-result">
                  <span className="result-label">Caller gets</span>
                  <span className="result-value good">0 pts</span>
                </div>
              </div>
              <div className="show-box bad-show">
                <div className="show-badge bad">❌ Bad Show</div>
                <p className="show-desc">An opponent has total <strong>≤ caller's total</strong></p>
                <div className="show-result">
                  <span className="result-label">Caller gets</span>
                  <span className="result-value bad">+40 pts</span>
                </div>
                <div className="show-result">
                  <span className="result-label">Lowest player</span>
                  <span className="result-value good">0 pts</span>
                </div>
              </div>
            </div>
          </section>

          {/* Special Rules + Winning with animation */}
          <div className="rules-row reverse">
            <div className="rules-animation">
              {spinnerAnimation && (
                <Lottie 
                  animationData={spinnerAnimation} 
                  loop={true}
                  className="lottie-animation"
                />
              )}
            </div>

            <div className="rules-col">
              <section className="rule-card">
                <div className="card-icon">✨</div>
                <h2>Special Rules</h2>
                <div className="special-list">
                  <div className="special-item">
                    <div className="special-icon">🃏</div>
                    <div>
                      <h3>Wild Card</h3>
                      <p>Card under closed deck has <strong>zero value</strong> — best card to hold!</p>
                    </div>
                  </div>
                  <div className="special-item">
                    <div className="special-icon">♠️♥️</div>
                    <div>
                      <h3>Matching Cards</h3>
                      <p>Drop 2+ same-value cards together <em>(e.g., 6♠ and 6♥)</em></p>
                    </div>
                  </div>
                  <div className="special-item">
                    <div className="special-icon">🔄</div>
                    <div>
                      <h3>Same Card Bonus</h3>
                      <p>Drop same card on open card = <strong>no need to pick</strong> <em>(e.g., 7♥ on 7♠)</em></p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rule-card winning-card">
                <div className="card-icon">🏆</div>
                <h2>Winning the Game</h2>
                <p>
                  Multiple rounds are played until players reach 200 points. 
                  First player to hit <strong>200 points is knocked out</strong>. 
                  The game continues until only <strong>1 winner</strong> remains!
                </p>
              </section>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="rules-footer">
          <button className="btn-back" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
          <button className="btn-play" onClick={() => navigate('/rooms')}>
            Play Now →
          </button>
        </footer>
      </div>
    </div>
  )
}

export default Rules
