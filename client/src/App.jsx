import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Loader from './components/Loader'
import { updateSEO } from './utils/seo'
import './App.css'

const Home = lazy(() => import('./pages/Home'))
const Game = lazy(() => import('./pages/Game'))
const Rules = lazy(() => import('./pages/Rules'))
const RoomList = lazy(() => import('./pages/RoomList'))
const RoomLobby = lazy(() => import('./pages/RoomLobby'))
const PracticeGame = lazy(() => import('./pages/PracticeGame'))
const QuickMatch = lazy(() => import('./pages/QuickMatch'))

function SEOUpdater() {
  const location = useLocation()
  useEffect(() => {
    updateSEO(location.pathname)
  }, [location.pathname])
  return null
}

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return <Loader message="Welcome to LowXena" />
  }

  return (
    <Router>
      <SEOUpdater />
      <Suspense fallback={<Loader message="Loading..." />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
          <Route path="/practice" element={<PracticeGame />} />
          <Route path="/quickmatch" element={<QuickMatch />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/rooms" element={<RoomList />} />
          <Route path="/room/:roomId" element={<RoomLobby />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
