import { useNavigate, Link } from 'react-router-dom'
import Lottie from 'lottie-react'
import { useState, useEffect, useRef } from 'react'
import { 
  ScrollText, Target, Layers, Scale, Sparkles, CheckCircle, XCircle, 
  Trophy, RefreshCw, ArrowLeft, ArrowRight, ChevronDown, Zap, 
  Crown, Star, Eye, Hand, Gem
} from 'lucide-react'
import './Rules.css'

const CARD_SUITS = ['♠', '♥', '♦', '♣']
const CARD_VALUES = [
  { card: 'A', value: 1 },
  { card: '2-10', value: 'Face Value' },
  { card: 'J', value: 11 },
  { card: 'Q', value: 12 },
  { card: 'K', value: 13 },
  { card: 'Wild', value: 0 },
]

function Rules() {
  const navigate = useNavigate()
  const [casinoAnimation, setCasinoAnimation] = useState(null)
  const [spinnerAnimation, setSpinnerAnimation] = useState(null)
  const [activeSection, setActiveSection] = useState(0)
  const [visibleSections, setVisibleSections] = useState(new Set())
  const sectionRefs = useRef([])

  useEffect(() => {
    fetch('/casino-cards.json')
      .then(res => res.json())
      .then(data => setCasinoAnimation(data))
    
    fetch('/cards-spinner.json')
      .then(res => res.json())
      .then(data => setSpinnerAnimation(data))
  }, [])

  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.dataset.sectionIdx)
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, idx]))
            if (entry.intersectionRatio > 0.3) {
              setActiveSection(idx)
            }
          }
        })
      },
      { threshold: [0.1, 0.3, 0.6], rootMargin: '-50px 0px' }
    )

    sectionRefs.current.forEach(ref => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  const sections = [
    { icon: <Target size={20} />, label: 'Objective' },
    { icon: <Layers size={20} />, label: 'How to Play' },
    { icon: <Scale size={20} />, label: 'Show Rules' },
    { icon: <Gem size={20} />, label: 'Card Values' },
    { icon: <Sparkles size={20} />, label: 'Special Rules' },
    { icon: <Trophy size={20} />, label: 'Winning' },
  ]

  const scrollToSection = (idx) => {
    sectionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="rules-page">
      {/* Animated Background */}
      <div className="rules-bg">
        <video
          className="rules-video-bg"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/background.jpg"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div className="rules-gradient-overlay"></div>
        <div className="rules-stars"></div>
        <div className="rules-particles"></div>
        {/* Floating Card Suits */}
        <div className="floating-suits">
          {Array.from({ length: 18 }).map((_, i) => (
            <span 
              key={i} 
              className={`floating-suit suit-${i % 4}`}
              style={{
                left: `${(i * 5.5 + 2) % 100}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${12 + (i % 5) * 3}s`,
                fontSize: `${16 + (i % 4) * 8}px`,
                opacity: 0.08 + (i % 3) * 0.04,
              }}
            >
              {CARD_SUITS[i % 4]}
            </span>
          ))}
        </div>
      </div>

      {/* Navigation Dots - Side */}
      <nav className="rules-nav" aria-label="Rules sections">
        {sections.map((s, i) => (
          <button 
            key={i}
            className={`nav-dot ${activeSection === i ? 'active' : ''} ${visibleSections.has(i) ? 'seen' : ''}`}
            onClick={() => scrollToSection(i)}
            title={s.label}
          >
            <span className="nav-dot-icon">{s.icon}</span>
            <span className="nav-dot-label">{s.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <div className="rules-scroll-container">
        {/* Hero Header */}
        <header className="rules-hero">
          <div className="hero-glow"></div>
          <div className="hero-badge">
            <ScrollText size={36} strokeWidth={1.5} />
          </div>
          <h1 className="hero-title">
            <span className="title-main">LeastCount</span>
            <span className="title-accent">Rules & Strategy</span>
          </h1>
          <p className="hero-subtitle">Master the game · Outsmart your opponents · Be the last one standing</p>
          <div className="hero-scroll-hint">
            <ChevronDown size={20} className="bounce-arrow" />
            <span>Scroll to explore</span>
          </div>
        </header>

        {/* Section 0: Game Objective */}
        <section 
          ref={el => sectionRefs.current[0] = el}
          data-section-idx="0"
          className={`rules-section ${visibleSections.has(0) ? 'visible' : ''}`}
        >
          <div className="section-inner objective-section">
            <div className="section-content">
              <div className="section-header">
                <div className="section-icon objective-icon"><Target size={24} /></div>
                <h2>Game Objective</h2>
              </div>
              <div className="objective-main">
                <div className="objective-card-visual">
                  <div className="point-circle">
                    <span className="point-number">200</span>
                    <span className="point-label">Point Limit</span>
                  </div>
                </div>
                <div className="objective-text">
                  <p className="objective-primary">
                    Push your opponents to reach <strong>200 points</strong> before you do.
                  </p>
                  <p className="objective-secondary">
                    The last player standing — the one who hasn't crossed 200 points — wins the entire game. 
                    Play smart, drop high-value cards, and call "Show" at the right moment!
                  </p>
                </div>
              </div>
            </div>
            <div className="section-lottie">
              {casinoAnimation && (
                <Lottie 
                  animationData={casinoAnimation} 
                  loop={true}
                  className="lottie-anim"
                />
              )}
            </div>
          </div>
        </section>

        {/* Section 1: How to Play */}
        <section 
          ref={el => sectionRefs.current[1] = el}
          data-section-idx="1"
          className={`rules-section ${visibleSections.has(1) ? 'visible' : ''}`}
        >
          <div className="section-inner">
            <div className="section-header">
              <div className="section-icon play-icon"><Layers size={24} /></div>
              <h2>How to Play</h2>
            </div>
            <div className="steps-timeline">
              {[
                {
                  num: 1,
                  icon: <Hand size={20} />,
                  title: 'Deal Cards',
                  desc: <>Each player gets <strong>7 cards</strong> from a 52-card deck <em>(hidden from opponents)</em></>
                },
                {
                  num: 2,
                  icon: <ArrowRight size={20} />,
                  title: 'Drop High Cards',
                  desc: <>Drop your <strong>highest value cards</strong> to keep your total score as low as possible</>
                },
                {
                  num: 3,
                  icon: <RefreshCw size={20} />,
                  title: 'Drop & Pick',
                  desc: <>Drop a card first, then pick one from the <strong>open or closed deck</strong></>
                },
                {
                  num: 4,
                  icon: <Eye size={20} />,
                  title: 'Call Show',
                  desc: <>Call <strong>"Show"</strong> when you believe you have the lowest total among all players</>
                },
              ].map((step, i) => (
                <div key={i} className={`timeline-step step-delay-${i}`}>
                  <div className="step-connector">
                    <div className="step-dot">
                      <span className="step-number">{step.num}</span>
                    </div>
                    {i < 3 && <div className="step-line"></div>}
                  </div>
                  <div className="step-card">
                    <div className="step-card-icon">{step.icon}</div>
                    <div className="step-card-content">
                      <h3>{step.title}</h3>
                      <p>{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Good Show vs Bad Show */}
        <section 
          ref={el => sectionRefs.current[2] = el}
          data-section-idx="2"
          className={`rules-section ${visibleSections.has(2) ? 'visible' : ''}`}
        >
          <div className="section-inner">
            <div className="section-header">
              <div className="section-icon show-icon"><Scale size={24} /></div>
              <h2>Good Show vs Bad Show</h2>
            </div>
            <div className="show-comparison">
              <div className="show-card good-show-card">
                <div className="show-card-glow good-glow"></div>
                <div className="show-card-header">
                  <CheckCircle size={22} />
                  <h3>Good Show</h3>
                </div>
                <p className="show-card-desc">
                  Caller has the <strong>lowest total</strong> among all players
                </p>
                <div className="show-card-results">
                  <div className="show-result-row">
                    <span className="result-who">Caller</span>
                    <span className="result-pts good-pts">
                      <Zap size={14} />
                      0 pts
                    </span>
                  </div>
                  <div className="show-result-row">
                    <span className="result-who">Others</span>
                    <span className="result-pts neutral-pts">Their card total</span>
                  </div>
                </div>
                <div className="show-verdict good-verdict">
                  <Star size={14} /> Best outcome!
                </div>
              </div>

              <div className="vs-divider">
                <span>VS</span>
              </div>

              <div className="show-card bad-show-card">
                <div className="show-card-glow bad-glow"></div>
                <div className="show-card-header">
                  <XCircle size={22} />
                  <h3>Bad Show</h3>
                </div>
                <p className="show-card-desc">
                  An opponent has total <strong>≤ caller's total</strong>
                </p>
                <div className="show-card-results">
                  <div className="show-result-row">
                    <span className="result-who">Caller</span>
                    <span className="result-pts bad-pts">
                      <Zap size={14} />
                      +40 pts penalty
                    </span>
                  </div>
                  <div className="show-result-row">
                    <span className="result-who">Lowest Player</span>
                    <span className="result-pts good-pts">
                      <Zap size={14} />
                      0 pts
                    </span>
                  </div>
                </div>
                <div className="show-verdict bad-verdict">
                  ⚠ Risky move!
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Card Values */}
        <section 
          ref={el => sectionRefs.current[3] = el}
          data-section-idx="3"
          className={`rules-section ${visibleSections.has(3) ? 'visible' : ''}`}
        >
          <div className="section-inner">
            <div className="section-header">
              <div className="section-icon values-icon"><Gem size={24} /></div>
              <h2>Card Values</h2>
            </div>
            <div className="card-values-grid">
              {CARD_VALUES.map((cv, i) => (
                <div key={i} className={`value-chip ${cv.card === 'Wild' ? 'wild-chip' : ''}`}>
                  <div className="value-chip-card">
                    <span className="chip-card-label">{cv.card}</span>
                    {cv.card !== 'Wild' && cv.card !== '2-10' && (
                      <span className="chip-card-suit">♠</span>
                    )}
                    {cv.card === 'Wild' && (
                      <span className="chip-card-wild">★</span>
                    )}
                  </div>
                  <div className="value-chip-info">
                    <span className="chip-value">{cv.value}</span>
                    <span className="chip-label">{cv.card === 'Wild' ? 'points (best!)' : 'points'}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="values-note">
              <Sparkles size={14} /> The <strong>Wild Card</strong> (card under the closed deck) has <strong>zero value</strong> — 
              always try to hold onto it!
            </p>
          </div>
        </section>

        {/* Section 4: Special Rules */}
        <section 
          ref={el => sectionRefs.current[4] = el}
          data-section-idx="4"
          className={`rules-section ${visibleSections.has(4) ? 'visible' : ''}`}
        >
          <div className="section-inner special-section">
            <div className="section-lottie-left">
              {spinnerAnimation && (
                <Lottie 
                  animationData={spinnerAnimation} 
                  loop={true}
                  className="lottie-anim"
                />
              )}
            </div>
            <div className="section-content">
              <div className="section-header">
                <div className="section-icon special-icon-badge"><Sparkles size={24} /></div>
                <h2>Special Rules</h2>
              </div>
              <div className="special-rules-list">
                <div className="special-rule-item">
                  <div className="special-rule-badge wild-badge">
                    <Crown size={20} />
                  </div>
                  <div className="special-rule-content">
                    <h3>Wild Card <span className="rule-tag">Zero Value</span></h3>
                    <p>The card placed under the closed deck has <strong>zero value</strong>. 
                       It's the most powerful card — hold it to minimize your score!</p>
                  </div>
                </div>
                <div className="special-rule-item">
                  <div className="special-rule-badge match-badge">
                    <Layers size={20} />
                  </div>
                  <div className="special-rule-content">
                    <h3>Matching Cards <span className="rule-tag">Combo Drop</span></h3>
                    <p>Drop 2 or more cards of the <strong>same value</strong> together in a single turn.
                       <em> Example: 6♠ and 6♥ dropped at once</em></p>
                  </div>
                </div>
                <div className="special-rule-item">
                  <div className="special-rule-badge bonus-badge">
                    <RefreshCw size={20} />
                  </div>
                  <div className="special-rule-content">
                    <h3>Same Card Bonus <span className="rule-tag">Skip Pick</span></h3>
                    <p>If you drop a card with the <strong>same value</strong> as the open card, 
                       you <strong>don't need to pick</strong> a new card!
                       <em> Example: drop 7♥ on 7♠</em></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Winning the Game */}
        <section 
          ref={el => sectionRefs.current[5] = el}
          data-section-idx="5"
          className={`rules-section ${visibleSections.has(5) ? 'visible' : ''}`}
        >
          <div className="section-inner winning-section">
            <div className="section-header">
              <div className="section-icon winning-icon"><Trophy size={24} /></div>
              <h2>Winning the Game</h2>
            </div>
            <div className="winning-flow">
              <div className="flow-step">
                <div className="flow-icon">
                  <RefreshCw size={22} />
                </div>
                <h3>Multiple Rounds</h3>
                <p>Play continues across several rounds, accumulating points each time.</p>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step knockout-step">
                <div className="flow-icon knockout-icon">
                  <XCircle size={22} />
                </div>
                <h3>Knockout at 200</h3>
                <p>First player to hit <strong>200 points</strong> is eliminated from the game.</p>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step winner-step">
                <div className="flow-icon winner-icon">
                  <Crown size={22} />
                </div>
                <h3>Last One Wins!</h3>
                <p>Game continues until only <strong>1 player</strong> remains — the ultimate champion!</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <footer className="rules-cta">
          <div className="cta-inner">
            <h2 className="cta-title">Ready to Play?</h2>
            <p className="cta-subtitle">Put your skills to the test and dominate the table!</p>
            <div className="cta-buttons">
              <Link className="cta-btn cta-back" to="/">
                <ArrowLeft size={18} />
                <span>Back to Home</span>
              </Link>
              <Link className="cta-btn cta-play" to="/rooms">
                <span>Play Now</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default Rules
