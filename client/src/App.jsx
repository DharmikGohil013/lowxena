import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Loader from './components/Loader'
import { NetworkStatusProvider } from './components/NetworkStatus'
import { SEO } from './utils/seo'
import './App.css'

const Home = lazy(() => import('./pages/Home'))
const Game = lazy(() => import('./pages/Game'))
const Rules = lazy(() => import('./pages/Rules'))
const RoomList = lazy(() => import('./pages/RoomList'))
const RoomLobby = lazy(() => import('./pages/RoomLobby'))
const PracticeGame = lazy(() => import('./pages/PracticeGame'))
const QuickMatch = lazy(() => import('./pages/QuickMatch'))
const About = lazy(() => import('./pages/About'))

function SEOUpdater() {
  const location = useLocation()
  return <SEO path={location.pathname} />
}

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const selected = localStorage.getItem('selected_card_back') || '/card_back.png'
    document.documentElement.style.setProperty('--card-back-image', `url('${selected}')`)

    // Skip the artificial loader delay — the route's own Suspense fallback covers
    // the lazy-chunk wait, and the extra paint hurt FCP/LCP.
    setLoading(false)
    if (typeof document !== 'undefined' && document.dispatchEvent) {
      document.dispatchEvent(new Event('app-rendered'))
    }
  }, [])

  if (loading) {
    return <Loader message="Welcome to LowXena" />
  }

  return (
    <NetworkStatusProvider>
      <HelmetProvider>
        <Router>
          <SEOUpdater />
          <main id="main-content">
            <Suspense fallback={<Loader message="Loading..." />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/game" element={<Game />} />
                <Route path="/practice" element={<PracticeGame />} />
                <Route path="/quickmatch" element={<QuickMatch />} />
                <Route path="/rules" element={<Rules />} />
                <Route path="/rooms" element={<RoomList />} />
                <Route path="/room/:roomId" element={<RoomLobby />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </Suspense>
          </main>
        </Router>
      </HelmetProvider>
    </NetworkStatusProvider>
  )
}

export default App
