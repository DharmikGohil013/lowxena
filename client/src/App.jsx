import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Game from './pages/Game'
import Rules from './pages/Rules'
import RoomList from './pages/RoomList'
import RoomLobby from './pages/RoomLobby'
import PracticeGame from './pages/PracticeGame'
import QuickMatch from './pages/QuickMatch'
import Loader from './components/Loader'
import './App.css'

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return <Loader message="Welcome to LowXena" />
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Game />} />
        <Route path="/practice" element={<PracticeGame />} />
        <Route path="/quickmatch" element={<QuickMatch />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/rooms" element={<RoomList />} />
        <Route path="/room/:roomId" element={<RoomLobby />} />
      </Routes>
    </Router>
  )
}

export default App
