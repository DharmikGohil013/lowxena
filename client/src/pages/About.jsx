import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { 
  Info, Cpu, Trophy, Sparkles, Code, Globe, 
  ArrowLeft, ArrowRight, ChevronDown, Flame, 
  ShieldCheck, Zap, Heart, Star, Target
} from 'lucide-react'
import './About.css'

const CARD_SUITS = ['♠', '♥', '♦', '♣']

function About() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState(0)
  const [visibleSections, setVisibleSections] = useState(new Set())
  const sectionRefs = useRef([])

  // Intersection Observer for scroll-triggered visual entry animations
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
    { icon: <Target size={20} />, label: 'Philosophy' },
    { icon: <Cpu size={20} />, label: 'Tech Stack' },
    { icon: <Code size={20} />, label: 'Architecture' },
    { icon: <Heart size={20} />, label: 'Behind The Game' }
  ]

  const scrollToSection = (idx) => {
    sectionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="about-page">
      {/* Animated Atmosphere Background */}
      <div className="about-bg">
        <video 
          className="about-video-bg" 
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div className="about-gradient-overlay"></div>
        <div className="about-stars"></div>
        <div className="about-particles"></div>
        
        {/* Glowing floating card suits */}
        <div className="floating-suits">
          {Array.from({ length: 16 }).map((_, i) => (
            <span 
              key={i} 
              className={`floating-suit suit-${i % 4}`}
              style={{
                left: `${(i * 6.5 + 4) % 100}%`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${14 + (i % 5) * 3}s`,
                fontSize: `${18 + (i % 4) * 8}px`,
                opacity: 0.05 + (i % 3) * 0.03,
              }}
            >
              {CARD_SUITS[i % 4]}
            </span>
          ))}
        </div>
      </div>

      {/* Floating Side Nav Indicator */}
      <nav className="about-nav" aria-label="About sections">
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

      {/* Scrollable Container */}
      <div className="about-scroll-container">
        {/* Massive Hero Header */}
        <header className="about-hero">
          <div className="hero-glow"></div>
          <div className="hero-badge">
            <img src="/logo.png" alt="LowXena Logo" className="about-logo-img" />
          </div>
          <h1 className="hero-title">
            <span className="title-main">LOWXENA</span>
            <span className="title-accent">The Vision & Tech</span>
          </h1>
          <p className="hero-subtitle">
            An ultra-premium interactive card gaming universe where the lowest score wins everything.
          </p>
          <div className="hero-scroll-hint">
            <ChevronDown size={20} className="bounce-arrow" />
            <span>Explore the Story</span>
          </div>
        </header>

        {/* Section 0: Philosophy */}
        <section 
          ref={el => sectionRefs.current[0] = el}
          data-section-idx="0"
          className={`about-section ${visibleSections.has(0) ? 'visible' : ''}`}
        >
          <div className="section-inner philosophy-section">
            <div className="section-content">
              <div className="section-header">
                <div className="section-icon philosophy-icon"><Target size={24} /></div>
                <h2>The Philosophy</h2>
              </div>
              <div className="philosophy-layout">
                <div className="philosophy-card-holder">
                  <div className="premium-dealt-cards">
                    <div className="dealt-card wild-glow">
                      <span className="suit">★</span>
                      <span className="val">W</span>
                    </div>
                    <div className="dealt-card ace-card">
                      <span className="suit">♠</span>
                      <span className="val">A</span>
                    </div>
                    <div className="dealt-card two-card">
                      <span className="suit">♥</span>
                      <span className="val">2</span>
                    </div>
                  </div>
                </div>
                <div className="philosophy-text">
                  <p className="philosophy-primary">
                    Most card games reward greedy accumulators. <strong>LowXena does the opposite.</strong> 
                  </p>
                  <p className="philosophy-secondary">
                    Inspired by traditional least-count mathematics, the objective is to purge high cards from your hand, 
                    strategize matching combos, hold zero-value wildcards, and call a Showdown when you believe you are at the absolute bottom. 
                    It's a game of ultimate restraint, risk calculation, and tactical psychological warfare.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Tech Stack */}
        <section 
          ref={el => sectionRefs.current[1] = el}
          data-section-idx="1"
          className={`about-section ${visibleSections.has(1) ? 'visible' : ''}`}
        >
          <div className="section-inner">
            <div className="section-header">
              <div className="section-icon tech-icon"><Cpu size={24} /></div>
              <h2>Built on Modern Tech</h2>
            </div>
            <div className="tech-cards-grid">
              <div className="tech-stack-card">
                <div className="tech-card-header">
                  <div className="tech-badge react-badge">React</div>
                  <h3>Frontend</h3>
                </div>
                <p>Powered by **React 19** and **Vite** for blistering hot-reloads, hardware-accelerated fanning card transitions, and micro-state integrity.</p>
                <div className="tech-tag-row">
                  <span>React 19</span>
                  <span>Vite</span>
                  <span>React Router 7</span>
                </div>
              </div>

              <div className="tech-stack-card">
                <div className="tech-card-header">
                  <div className="tech-badge node-badge">Node</div>
                  <h3>Backend</h3>
                </div>
                <p>Run by a high-performance **Express.js API** server featuring real-time WebSockets, secure routes, and robust game state listeners.</p>
                <div className="tech-tag-row">
                  <span>Node.js</span>
                  <span>Express</span>
                  <span>WebSockets</span>
                </div>
              </div>

              <div className="tech-stack-card">
                <div className="tech-card-header">
                  <div className="tech-badge pg-badge">Supabase</div>
                  <h3>Database</h3>
                </div>
                <p>Utilizes **Supabase PostgreSQL** for real-time user records, persistent matching statistics, scores, histories, and live leaderboard syncs.</p>
                <div className="tech-tag-row">
                  <span>PostgreSQL</span>
                  <span>Supabase client</span>
                  <span>SQL triggers</span>
                </div>
              </div>

              <div className="tech-stack-card">
                <div className="tech-card-header">
                  <div className="tech-badge css-badge">CSS3</div>
                  <h3>Visual System</h3>
                </div>
                <p>Designed with customized **3D Perspective CSS3**, glassmorphisms, mahogany bevels, and golden HSL neon rings to deliver maximum visual wow.</p>
                <div className="tech-tag-row">
                  <span>3D Transforms</span>
                  <span>Vanilla CSS</span>
                  <span>Animations</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Architecture */}
        <section 
          ref={el => sectionRefs.current[2] = el}
          data-section-idx="2"
          className={`about-section ${visibleSections.has(2) ? 'visible' : ''}`}
        >
          <div className="section-inner arch-section">
            <div className="section-header">
              <div className="section-icon arch-icon"><Code size={24} /></div>
              <h2>Premium Platform Architecture</h2>
            </div>
            
            <div className="arch-pillars-grid">
              <div className="arch-pillar-item">
                <div className="arch-pillar-badge auth-badge">
                  <ShieldCheck size={20} />
                </div>
                <div className="arch-pillar-content">
                  <h3>Self-Healing Authentication</h3>
                  <p>Equipped with global response interceptors that track 401/403 session expirations, auto-evict stale tokens gracefully, and route players safely withtimeout warning prompts to avoid infinite credential loops.</p>
                </div>
              </div>

              <div className="arch-pillar-item">
                <div className="arch-pillar-badge lobby-badge">
                  <Flame size={20} />
                </div>
                <div className="arch-pillar-content">
                  <h3>Live Seat Occupancy Visualizers</h3>
                  <p>Lobby metrics show real-time player distributions, sort systems, and interactive vacancy lights before users launch private or public game spaces.</p>
                </div>
              </div>

              <div className="arch-pillar-item">
                <div className="arch-pillar-badge table-badge">
                  <Sparkles size={20} />
                </div>
                <div className="arch-pillar-content">
                  <h3>Immersive 3D Felt Table</h3>
                  <p>Built with tilting perspective planes, walnut wood rims, golden lasers, leather card rack racks, and automatic padlock overlays on metallic steel buttons.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Creator */}
        <section 
          ref={el => sectionRefs.current[3] = el}
          data-section-idx="3"
          className={`about-section ${visibleSections.has(3) ? 'visible' : ''}`}
        >
          <div className="section-inner creator-section">
            <div className="section-header">
              <div className="section-icon creator-icon"><Heart size={24} /></div>
              <h2>Behind the Scenes</h2>
            </div>
            <div className="creator-card">
              <div className="creator-avatar-ring">
                <span className="creator-initial">DG</span>
              </div>
              <div className="creator-details">
                <h3>Dharmik Gohil</h3>
                <span className="creator-role">Lead Architect & Game Developer</span>
                <p>
                  LowXena is born out of a desire to build the ultimate responsive browser-based card multiplayer platform, combining high-end luxury aesthetics with deep, seamless state architecture.
                </p>
                <div className="creator-links">
                  <a href="https://dharmikgohil.art/" target="_blank" rel="noopener noreferrer" className="creator-link-btn">
                    <Globe size={16} />
                    <span>dharmikgohil.art</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic CTA Footer */}
        <footer className="about-cta">
          <div className="cta-inner">
            <h2 className="cta-title">Claim Your Seat</h2>
            <p className="cta-subtitle">The table is dealt, and your opponents are waiting.</p>
            <div className="cta-buttons">
              <button className="cta-btn cta-back" onClick={() => navigate('/')}>
                <ArrowLeft size={18} />
                <span>Back to Home</span>
              </button>
              <button className="cta-btn cta-play" onClick={() => navigate('/rooms')}>
                <span>Enter Lobby</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default About
