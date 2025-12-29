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
        <header className="rules-header">
          <h1>LeastCount Game Rules</h1>
          <p className="subtitle">Easy and fun card game for 2 or more players</p>
        </header>

        <div className="rules-body">
          {/* Casino Animation Right - Game Objective & How to Play */}
          <div className="rule-section-with-animation">
            <div className="rule-content-left">
              <section className="rule-card">
                <h2 className="section-title">Game Objective</h2>
                <p className="section-content">
                  Push your opponents to reach 200 points before you do. The last person to avoid reaching 200 points wins the game.
                </p>
              </section>

              <section className="rule-card">
                <h2 className="section-title">How to Play</h2>
                <ul className="play-list">
                  <li>Each player gets <strong>7 cards</strong> from a 52-card deck (cards are random and hidden from opponents)</li>
                  <li>Players take turns dropping their <strong>highest value cards</strong> to keep their score low</li>
                  <li>Drop a card first, then pick from either the open or closed deck</li>
                  <li>Call <strong>"Show"</strong> when you think you have the lowest total to close the round</li>
                </ul>
              </section>

              <section className="rule-card">
                <h2 className="section-title">Good Show vs Bad Show</h2>
                <div className="show-grid">
                  <div className="show-box good-show">
                    <h3>Good Show</h3>
                    <p className="desc">Caller has the lowest total among all players</p>
                    <p className="result"><strong>Caller gets:</strong> 0 points</p>
                  </div>
                  <div className="show-box bad-show">
                    <h3>Bad Show</h3>
                    <p className="desc">An opponent has total ≤ caller's total</p>
                    <p className="result"><strong>Caller gets:</strong> 40 points penalty</p>
                    <p className="result"><strong>Player with least total:</strong> 0 points</p>
                  </div>
                </div>
              </section>
            </div>
            
            <div className="animation-right">
              {casinoAnimation && (
                <Lottie 
                  animationData={casinoAnimation} 
                  loop={true}
                  className="lottie-animation"
                />
              )}
            </div>
          </div>

          {/* Spinner Animation Left - Special Rules & Winning */}
          <div className="rule-section-with-animation reverse">
            <div className="animation-left">
              {spinnerAnimation && (
                <Lottie 
                  animationData={spinnerAnimation} 
                  loop={true}
                  className="lottie-animation"
                />
              )}
            </div>

            <div className="rule-content-right">
              <section className="rule-card">
                <h2 className="section-title">Special Rules</h2>
                <div className="special-rules">
                  <div className="special-item">
                    <div className="special-content">
                      <h3>Wild Card</h3>
                      <p>Card under closed deck has zero value - best card to hold!</p>
                    </div>
                  </div>
                  <div className="special-item">
                    <div className="special-content">
                      <h3>Matching Cards</h3>
                      <p>Drop 2 or more same cards together (e.g., 6♠ and 6♥)</p>
                    </div>
                  </div>
                  <div className="special-item">
                    <div className="special-content">
                      <h3>Same Card Bonus</h3>
                      <p>Drop same card on open card = no need to pick (e.g., 7♥ on 7♠)</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rule-card winning-section">
                <h2 className="section-title">Winning the Game</h2>
                <p className="section-content">
                  Multiple rounds are played until players reach 200 points. First player to hit <strong>200 points is knocked out</strong>. The game continues until only <strong>1 winner</strong> remains!
                </p>
              </section>
            </div>
          </div>
        </div>

        <footer className="rules-footer">
          <button className="btn-back" onClick={() => navigate('/')}>
            ← Back
          </button>
        </footer>
      </div>
    </div>
  )
}

export default Rules
