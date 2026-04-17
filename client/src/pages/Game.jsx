import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { gameAPI } from '../services/api'
import Loader from '../components/Loader'
import './Game.css'

// Card suits and values
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades']
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

// Card suit symbols
const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
}

// Shuffle array function
const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Calculate card point value
const getCardValue = (cardValue) => {
  if (cardValue === 'A') return 1
  if (cardValue === 'J') return 11
  if (cardValue === 'Q') return 12
  if (cardValue === 'K') return 13
  return parseInt(cardValue)
}

// Calculate total points for a hand
const calculateHandPoints = (cards) => {
  if (!cards || cards.length === 0) return 0
  return cards.reduce((total, card) => total + getCardValue(card.value), 0)
}

function Game() {
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const [roomDetails, setRoomDetails] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [gameState, setGameState] = useState({
    deck: [],
    playerHands: {}, // Store each player's cards
    playedCards: [],
    currentTurn: null,
    currentTurnIndex: 0,
    gameStarted: false,
    isShuffling: false,
    isDealing: false,
    dealingCardIndex: 0
  })
  const [countdown, setCountdown] = useState(30)
  const [showScoreboard, setShowScoreboard] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const navigate = useNavigate()
  const roomId = searchParams.get('roomId')

  useEffect(() => {
    fetchCurrentUser()
    if (roomId) {
      fetchRoomDetails()
    } else {
      setLoading(false)
    }
    
    // Poll for game updates
    const interval = setInterval(() => {
      if (roomId) {
        fetchRoomDetails()
        fetchGameState()
      }
    }, 1500)
    
    return () => clearInterval(interval)
  }, [roomId])

  // Once we have room details and current user, check if we need to initialize
  useEffect(() => {
    if (roomDetails && currentUser && roomId) {
      fetchGameState()
    }
  }, [roomDetails?.id, currentUser?.id])

  // Sync game state across all players
  const fetchGameState = async () => {
    if (!roomId) return
    
    try {
      const data = await gameAPI.getGameState(roomId)
      
      if (data && data.gameState && data.gameState.gameStarted) {
        setGameState(prev => ({
          ...prev,
          deck: data.gameState.deck || prev.deck,
          playerHands: data.gameState.playerHands || prev.playerHands,
          playedCards: data.gameState.playedCards || prev.playedCards,
          currentTurn: data.gameState.currentTurn || prev.currentTurn,
          currentTurnIndex: data.gameState.currentTurnIndex ?? prev.currentTurnIndex,
          gameStarted: true,
          isShuffling: false,
          isDealing: false
        }))
        
        // Sync countdown from server timestamp
        if (data.gameState.countdownTimestamp) {
          const elapsed = Math.floor((Date.now() - data.gameState.countdownTimestamp) / 1000)
          const remaining = Math.max(0, 30 - elapsed)
          setCountdown(remaining)
        }
      }
    } catch (error) {
      console.error('Error fetching game state:', error)
    }
  }

  // Host initializes the game: shuffle, deal, save to server
  useEffect(() => {
    if (!roomDetails?.players || !currentUser) return
    if (gameState.gameStarted || gameState.isShuffling || gameState.isDealing) return
    
    // Only the host creates the deck
    const isHostPlayer = currentUser.id === roomDetails.hostId
    if (!isHostPlayer) return
    
    // Start shuffle animation
    setGameState(prev => ({ ...prev, isShuffling: true }))
    
    setTimeout(() => {
      // Create and shuffle deck
      const fullDeck = []
      SUITS.forEach(suit => {
        VALUES.forEach(value => {
          fullDeck.push({ 
            suit, value, 
            id: `${value}-${suit}`,
            color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black'
          })
        })
      })
      const shuffledDeck = shuffleArray(fullDeck)
      
      setGameState(prev => ({ ...prev, deck: shuffledDeck, isShuffling: false }))
      
      // Deal cards
      const numPlayers = roomDetails.players.length
      const cardsPerPlayer = 7
      const totalCards = numPlayers * cardsPerPlayer
      const newPlayerHands = {}
      
      roomDetails.players.forEach((player, index) => {
        newPlayerHands[player.id] = shuffledDeck.slice(index * cardsPerPlayer, (index + 1) * cardsPerPlayer)
      })
      
      const remainingDeck = shuffledDeck.slice(totalCards)
      
      // Show dealing animation briefly
      setGameState(prev => ({ ...prev, isDealing: true }))
      
      setTimeout(() => {
        const newState = {
          deck: remainingDeck,
          playerHands: newPlayerHands,
          playedCards: [],
          currentTurn: roomDetails.players[0]?.id,
          currentTurnIndex: 0,
          gameStarted: true,
          isShuffling: false,
          isDealing: false,
          countdownTimestamp: Date.now()
        }
        
        setGameState(prev => ({ ...prev, ...newState }))
        setCountdown(30)
        
        // Save full game state to server for all players to sync
        gameAPI.updateGameState(roomId, newState)
          .catch(err => console.error('Error saving game state:', err))
      }, 1500)
    }, 2000)
  }, [roomDetails?.players?.length, currentUser?.id, gameState.gameStarted])

  // Countdown timer effect
  useEffect(() => {
    if (!gameState.gameStarted || !roomDetails?.players) return
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        const newCount = prev - 1
        
        // Auto-advance if time is up and it's my turn
        if (newCount <= 0 && isMyTurn()) {
          handleNextTurn()
          return 30
        }
        
        return newCount > 0 ? newCount : prev
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [gameState.gameStarted, gameState.currentTurnIndex, roomDetails?.players])

  const fetchCurrentUser = () => {
    const userData = JSON.parse(localStorage.getItem('userData'))
    if (userData) setCurrentUser(userData)
  }

  const fetchRoomDetails = async () => {
    try {
      const response = await gameAPI.getRoomDetails(roomId)
      setRoomDetails(response)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching room details:', err)
      setLoading(false)
    }
  }

  const handleNextTurn = async () => {
    if (!roomDetails?.players) return
    
    const nextIndex = (gameState.currentTurnIndex + 1) % roomDetails.players.length
    const nextPlayer = roomDetails.players[nextIndex]
    
    const updatedState = {
      ...gameState,
      currentTurn: nextPlayer.id,
      currentTurnIndex: nextIndex,
      gameStarted: true,
      countdownTimestamp: Date.now(),
      isShuffling: false,
      isDealing: false
    }
    
    setGameState(updatedState)
    setCountdown(30)
    
    // Sync to server
    try {
      await gameAPI.updateGameState(roomId, updatedState)
    } catch (error) {
      console.error('Error updating game state:', error)
    }
  }

  const handleMove = () => {
    if (!isMyTurn()) return
    
    // TODO: Implement move logic
    console.log('Move button pressed')
    
    // Advance to next turn
    handleNextTurn()
  }

  const handleLowXena = () => {
    if (!isMyTurn()) return
    
    // TODO: Implement LowXena logic
    console.log('LowXena button pressed')
    
    // Advance to next turn
    handleNextTurn()
  }

  const isMyTurn = () => {
    return currentUser && gameState.currentTurn === currentUser.id
  }

  const getCurrentTurnPlayer = () => {
    if (!roomDetails?.players || !gameState.currentTurn) return null
    return roomDetails.players.find(p => p.id === gameState.currentTurn)
  }

  const isHost = () => {
    return currentUser && roomDetails && currentUser.id === roomDetails.hostId
  }

  const handleEndGame = async () => {
    if (!isHost()) return
    if (window.confirm('Are you sure you want to end this game?')) {
      try {
        // This will be implemented with backend
        navigate(`/room/${roomId}`)
      } catch (err) {
        console.error('Error ending game:', err)
      }
    }
  }

  const getPlayerPosition = (index, total) => {
    // Position other players around the table
    // For 2 players total (1 other): top center
    // For 3 players total (2 others): top left, top right
    // For 4 players total (3 others): left, top, right
    // For 5 players total (4 others): left, top-left, top-right, right
    
    const positions = [
      // 2 players: 1 other player
      [{ top: '15%', left: '50%', transform: 'translate(-50%, 0)' }],
      // 3 players: 2 other players  
      [
        { top: '15%', left: '25%', transform: 'translate(-50%, 0)' },
        { top: '15%', left: '75%', transform: 'translate(-50%, 0)' }
      ],
      // 4 players: 3 other players
      [
        { top: '40%', left: '8%', transform: 'translate(0, -50%)' },
        { top: '15%', left: '50%', transform: 'translate(-50%, 0)' },
        { top: '40%', right: '8%', transform: 'translate(0, -50%)' }
      ],
      // 5 players: 4 other players
      [
        { top: '40%', left: '8%', transform: 'translate(0, -50%)' },
        { top: '15%', left: '35%', transform: 'translate(-50%, 0)' },
        { top: '15%', right: '35%', transform: 'translate(50%, 0)' },
        { top: '40%', right: '8%', transform: 'translate(0, -50%)' }
      ]
    ]
    
    const positionSet = positions[total - 1] || positions[3]
    return positionSet[index] || positions[0][0]
  }

  const getCurrentPlayerIndex = () => {
    if (!currentUser || !roomDetails?.players) return -1
    return roomDetails.players.findIndex(p => p.id === currentUser.id)
  }

  const getOrderedPlayers = () => {
    if (!roomDetails?.players) return []
    const currentIndex = getCurrentPlayerIndex()
    if (currentIndex === -1) return roomDetails.players
    
    // Put current player first, then arrange others
    const ordered = [...roomDetails.players]
    const currentPlayer = ordered.splice(currentIndex, 1)[0]
    return [currentPlayer, ...ordered]
  }

  if (loading) {
    return <Loader message="Loading Game..." />
  }

  const orderedPlayers = getOrderedPlayers()
  const myCards = gameState.playerHands[orderedPlayers[0]?.id]
  const otherPlayers = orderedPlayers.slice(1)

  return (
    <div className="game-container">
      {/* Background */}
      <div className="game-background">
        <div className="stars"></div>
        <div className="game-gradient"></div>
      </div>

      {/* Top Bar: controls + turn info */}
      <div className="game-top-bar">
        <button 
          className="control-btn"
          onClick={() => setShowScoreboard(!showScoreboard)}
          title="Scoreboard"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </button>

        {gameState.gameStarted && (
          <div className="turn-indicator">
            <span className="turn-label">
              {isMyTurn() ? '🎯 Your Turn' : `⏳ ${getCurrentTurnPlayer()?.name}'s Turn`}
            </span>
            <span className="turn-timer">{countdown}s</span>
          </div>
        )}

        <button 
          className="control-btn"
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>

      {/* Other Players Row */}
      <div className="opponents-row">
        {otherPlayers.map((player) => (
          <div key={player.id} className={`opponent-card ${gameState.currentTurn === player.id ? 'active-turn' : ''}`}>
            <div className="opponent-avatar">
              {player.avatarUrl ? (
                <img src={player.avatarUrl} alt={player.name} />
              ) : (
                <span className="opponent-letter">{player.name?.charAt(0).toUpperCase()}</span>
              )}
              {player.isHost && <span className="crown-badge">👑</span>}
            </div>
            <div className="opponent-info">
              <span className="opponent-name">{player.name}</span>
              <span className="opponent-score">0 pts</span>
              <span className="opponent-cards">{gameState.playerHands[player.id]?.length || 0} cards</span>
            </div>
          </div>
        ))}
      </div>

      {/* Central Game Table */}
      <div className="game-table">
        <div className="table-surface">
          <div className="table-felt"></div>
          
          {/* Deck */}
          <div className="deck-area">
            <div className="deck-stack">
              {gameState.deck.length > 0 ? (
                [...Array(Math.min(4, gameState.deck.length))].map((_, i) => (
                  <div 
                    key={i} 
                    className="card-back deck-card" 
                    style={{ transform: `translateY(-${i * 2}px)` }}
                  >
                    <div className="card-pattern"></div>
                  </div>
                ))
              ) : (
                <div className="empty-deck">Empty</div>
              )}
            </div>
            <span className="deck-label">{gameState.deck.length}</span>
          </div>

          {/* Played Cards */}
          <div className="played-area">
            {gameState.playedCards.length === 0 ? (
              <div className="play-placeholder">Play here</div>
            ) : (
              gameState.playedCards.map((card, index) => (
                <div key={card.id} className="played-card" style={{ 
                  transform: `rotate(${Math.random() * 20 - 10}deg)`,
                  zIndex: index 
                }}></div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {gameState.gameStarted && (
        <div className="game-actions">
          <button 
            className={`action-btn btn-move ${!isMyTurn() ? 'disabled' : ''}`}
            onClick={handleMove}
            disabled={!isMyTurn()}
          >
            Move
          </button>
          <button 
            className={`action-btn btn-lowxena ${!isMyTurn() ? 'disabled' : ''}`}
            onClick={handleLowXena}
            disabled={!isMyTurn()}
          >
            LowXena!
          </button>
        </div>
      )}

      {/* Current Player Hand */}
      {orderedPlayers[0] && (
        <div className="my-hand-section">
          <div className="my-info-bar">
            <div className="my-avatar">
              {orderedPlayers[0].avatarUrl ? (
                <img src={orderedPlayers[0].avatarUrl} alt={orderedPlayers[0].name} />
              ) : (
                <span className="my-avatar-letter">{orderedPlayers[0].name?.charAt(0).toUpperCase()}</span>
              )}
              {orderedPlayers[0].isHost && <span className="crown-badge">👑</span>}
            </div>
            <div className="my-details">
              <span className="my-name">{orderedPlayers[0].name}</span>
              <span className="my-stats">{myCards?.length || 0} cards · {calculateHandPoints(myCards)} pts</span>
            </div>
          </div>
          <div className="my-cards-fan">
            {myCards?.map((card, i) => (
              <div 
                key={card.id} 
                className="hand-card"
                style={{ '--i': i, '--total': myCards.length }}
              >
                <div className="playing-card" data-color={card.color}>
                  <div className="card-corner top-left">
                    <span className="card-value">{card.value}</span>
                    <span className="card-suit">{SUIT_SYMBOLS[card.suit]}</span>
                  </div>
                  <div className="card-center">
                    <span className="card-suit-large">{SUIT_SYMBOLS[card.suit]}</span>
                  </div>
                  <div className="card-corner bottom-right">
                    <span className="card-value">{card.value}</span>
                    <span className="card-suit">{SUIT_SYMBOLS[card.suit]}</span>
                  </div>
                </div>
              </div>
            )) || (
              [...Array(7)].map((_, i) => (
                <div key={i} className="hand-card" style={{ '--i': i, '--total': 7 }}>
                  <div className="card-back"><div className="card-pattern"></div></div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Shuffle Overlay */}
      {gameState.isShuffling && (
        <div className="overlay-screen">
          <div className="overlay-content">
            <div className="shuffle-cards">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="shuffle-card" style={{ animationDelay: `${i * 0.12}s` }}>
                  <div className="card-back"><div className="card-pattern"></div></div>
                </div>
              ))}
            </div>
            <h2 className="overlay-title">Shuffling Deck...</h2>
          </div>
        </div>
      )}

      {/* Dealing Overlay */}
      {gameState.isDealing && (
        <div className="overlay-screen">
          <div className="overlay-content">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flying-card" style={{ animationDelay: `${i * 0.3}s` }}>
                <div className="card-back"><div className="card-pattern"></div></div>
              </div>
            ))}
            <h2 className="overlay-title">Dealing Cards...</h2>
          </div>
        </div>
      )}

      {/* Scoreboard Modal */}
      {showScoreboard && (
        <div className="modal-overlay" onClick={() => setShowScoreboard(false)}>
          <div className="game-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowScoreboard(false)}>✕</button>
            <h2 className="modal-heading">📊 Scoreboard</h2>
            <div className="scoreboard-list">
              {roomDetails?.players?.map((player, index) => (
                <div key={player.id} className="score-row">
                  <span className="score-rank">#{index + 1}</span>
                  <span className="score-name">{player.name}</span>
                  <span className="score-pts">0 pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="game-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSettings(false)}>✕</button>
            <h2 className="modal-heading">⚙️ Settings</h2>
            <div className="settings-list">
              <button className="settings-item" onClick={() => navigate('/')}>
                🚪 Leave Game
              </button>
              <button className="settings-item" onClick={() => navigate(`/room/${roomId}`)}>
                ← Back to Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Game
