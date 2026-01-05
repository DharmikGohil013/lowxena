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
    gameStarted: false,
    isShuffling: false,
    isDealing: false,
    dealingCardIndex: 0
  })
  const [showScoreboard, setShowScoreboard] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const navigate = useNavigate()
  const roomId = searchParams.get('roomId')

  useEffect(() => {
    fetchCurrentUser()
    if (roomId) {
      fetchRoomDetails()
      initializeGame()
    } else {
      setLoading(false)
    }
    
    // Poll for game updates
    const interval = setInterval(() => {
      if (roomId) fetchRoomDetails()
    }, 2000)
    
    return () => clearInterval(interval)
  }, [roomId])

  // Auto-deal cards when game initializes and players are loaded
  useEffect(() => {
    if (roomDetails?.players && gameState.deck.length === 52 && !gameState.gameStarted && !gameState.isShuffling && !gameState.isDealing) {
      // Delay after shuffle completes
      const timer = setTimeout(() => {
        dealCards()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [roomDetails?.players, gameState.deck.length, gameState.gameStarted, gameState.isShuffling, gameState.isDealing])

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

  const initializeGame = () => {
    // Create full 52 card deck
    const fullDeck = []
    SUITS.forEach(suit => {
      VALUES.forEach(value => {
        fullDeck.push({ 
          suit, 
          value, 
          id: `${value}-${suit}`,
          color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black'
        })
      })
    })
    
    // Show shuffle animation
    setGameState(prev => ({ 
      ...prev, 
      deck: fullDeck,
      isShuffling: true,
      gameStarted: false 
    }))
    
    // Shuffle after animation
    setTimeout(() => {
      const shuffledDeck = shuffleArray(fullDeck)
      setGameState(prev => ({ 
        ...prev, 
        deck: shuffledDeck,
        isShuffling: false
      }))
    }, 2000) // 2 second shuffle animation
  }

  const dealCards = () => {
    if (!roomDetails?.players || gameState.deck.length === 0) return
    
    const numPlayers = roomDetails.players.length
    const cardsPerPlayer = 7
    const totalCards = numPlayers * cardsPerPlayer
    
    // Start dealing animation
    setGameState(prev => ({
      ...prev,
      isDealing: true,
      dealingCardIndex: 0
    }))
    
    // Animate dealing cards one by one
    let cardIndex = 0
    const dealInterval = setInterval(() => {
      if (cardIndex >= totalCards) {
        clearInterval(dealInterval)
        
        // Finalize the deal
        const newPlayerHands = {}
        let deckCopy = [...gameState.deck]
        
        roomDetails.players.forEach((player, index) => {
          newPlayerHands[player.id] = deckCopy.slice(index * cardsPerPlayer, (index + 1) * cardsPerPlayer)
        })
        
        const remainingDeck = deckCopy.slice(totalCards)
        
        setGameState(prev => ({
          ...prev,
          playerHands: newPlayerHands,
          deck: remainingDeck,
          gameStarted: true,
          isDealing: false,
          dealingCardIndex: 0,
          currentTurn: roomDetails.players[0]?.id
        }))
        
        console.log('Cards dealt! Remaining in deck:', remainingDeck.length)
      } else {
        setGameState(prev => ({
          ...prev,
          dealingCardIndex: cardIndex + 1
        }))
        cardIndex++
      }
    }, 150) // Deal one card every 150ms
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

  return (
    <div className="game-container">
      {/* Background */}
      <div className="game-background">
        <div className="stars"></div>
        <div className="game-gradient"></div>
      </div>

      {/* Top Controls */}
      <div className="game-controls">
        {/* Scoreboard Button */}
        <button 
          className="control-btn scoreboard-btn"
          onClick={() => setShowScoreboard(!showScoreboard)}
          title="Scoreboard"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </button>

        {/* Settings Button */}
        <button 
          className="control-btn settings-btn"
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6m0-18a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"></path>
            <path d="M16.24 7.76l-2.12 2.12m-4.24 4.24l-2.12 2.12m8.48 0l-2.12-2.12m-4.24-4.24L7.76 7.76"></path>
          </svg>
        </button>
      </div>

      {/* Players positioned around the table */}
      <div className="players-area">
        {orderedPlayers.map((player, index) => {
          const isCurrentPlayer = index === 0
          const position = isCurrentPlayer 
            ? null // Current player handled separately below
            : getPlayerPosition(index - 1, orderedPlayers.length - 1)
          
          // Don't render current player here - they'll be at bottom
          if (isCurrentPlayer) return null
          
          return (
            <div 
              key={player.id} 
              className="player-seat other-player"
              style={position}
            >
              <div className="player-badge">
                <div className="player-avatar-small">
                  {player.avatarUrl ? (
                    <img src={player.avatarUrl} alt={player.name} />
                  ) : (
                    <div className="avatar-letter-small">
                      {player.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {player.isHost && <div className="host-crown-small">👑</div>}
                </div>
                <div className="player-badge-info">
                  <div className="player-name-badge">{player.name}</div>
                  <div className="player-score-badge">0/3</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Current Player at Bottom Center with Cards */}
      {orderedPlayers[0] && (
        <div className="current-player-section">
          <div className="current-player-info">
            <div className="current-player-avatar">
              {orderedPlayers[0].avatarUrl ? (
                <img src={orderedPlayers[0].avatarUrl} alt={orderedPlayers[0].name} />
              ) : (
                <div className="current-avatar-letter">
                  {orderedPlayers[0].name?.charAt(0).toUpperCase()}
                </div>
              )}
              {orderedPlayers[0].isHost && <div className="current-host-crown">👑</div>}
            </div>
            <div className="current-player-details">
              <div className="current-player-name">{orderedPlayers[0].name}</div>
              <div className="current-player-score">0/3</div>
              <div className="current-player-card-count">
                Cards: {gameState.playerHands[orderedPlayers[0].id]?.length || 0} | Total Points: {calculateHandPoints(gameState.playerHands[orderedPlayers[0].id])}
              </div>
            </div>
          </div>
          
          {/* Current Player's Cards */}
          <div className="current-player-cards">
            {gameState.playerHands[orderedPlayers[0].id]?.map((card, i) => (
              <div 
                key={card.id} 
                className="card-in-hand"
              >
                <div className="playing-card" data-suit={card.suit} data-color={card.color}>
                  <div className="card-corner top-left">
                    <div className="card-value">{card.value}</div>
                    <div className="card-suit">{SUIT_SYMBOLS[card.suit]}</div>
                  </div>
                  <div className="card-center">
                    <div className="card-suit-large">{SUIT_SYMBOLS[card.suit]}</div>
                  </div>
                  <div className="card-corner bottom-right">
                    <div className="card-value">{card.value}</div>
                    <div className="card-suit">{SUIT_SYMBOLS[card.suit]}</div>
                  </div>
                </div>
              </div>
            )) || (
              // Show card backs before dealing
              [...Array(7)].map((_, i) => (
                <div 
                  key={i} 
                  className="card-in-hand"
                >
                  <div className="card-back">
                    <div className="card-pattern"></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Central Game Table/Desk */}
      <div className="game-table">
        <div className="table-surface">
          <div className="table-felt"></div>
          
          {/* Deck */}
          <div className="deck-area">
            <div className="deck-stack">
              {gameState.deck.length > 0 ? (
                [...Array(Math.min(5, gameState.deck.length))].map((_, i) => (
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
            <div className="deck-label">{gameState.deck.length} Cards</div>
          </div>

          {/* Played Cards Area */}
          <div className="played-cards-area">
            {gameState.playedCards.length === 0 ? (
              <div className="play-area-placeholder">
                Play cards here
              </div>
            ) : (
              gameState.playedCards.map((card, index) => (
                <div key={card.id} className="played-card" style={{ 
                  transform: `rotate(${Math.random() * 20 - 10}deg)`,
                  zIndex: index 
                }}>
                  {/* Card content */}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Game Action Buttons */}
      <div className="game-action-controls">
        <button className="game-action-btn move-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14"></path>
            <path d="M12 5l7 7-7 7"></path>
          </svg>
          Move
        </button>
        <button className="game-action-btn lowxena-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          LowXena
        </button>
      </div>

      {/* Shuffle Animation Overlay */}
      {gameState.isShuffling && (
        <div className="shuffle-overlay">
          <div className="shuffle-animation">
            <div className="shuffle-cards">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className="shuffle-card"
                  style={{ 
                    animationDelay: `${i * 0.1}s`,
                    transform: `rotate(${i * 45}deg)` 
                  }}
                >
                  <div className="card-back">
                    <div className="card-pattern"></div>
                  </div>
                </div>
              ))}
            </div>
            <h2 className="shuffle-text">Shuffling Deck...</h2>
          </div>
        </div>
      )}

      {/* Dealing Animation Overlay */}
      {gameState.isDealing && (
        <div className="dealing-overlay">
          <div className="dealing-animation">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i}
                className="flying-card"
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                <div className="card-back">
                  <div className="card-pattern"></div>
                </div>
              </div>
            ))}
            <h2 className="dealing-text">
              Dealing Cards... {gameState.dealingCardIndex}/{(roomDetails?.players?.length || 0) * 7}
            </h2>
          </div>
        </div>
      )}

      {/* Scoreboard Modal */}
      {showScoreboard && (
        <div className="modal-overlay" onClick={() => setShowScoreboard(false)}>
          <div className="scoreboard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-close" onClick={() => setShowScoreboard(false)}>✕</div>
            <h2>📊 Scoreboard</h2>
            <div className="scoreboard-list">
              {roomDetails?.players?.map((player, index) => (
                <div key={player.id} className="score-item">
                  <span className="score-rank">#{index + 1}</span>
                  <span className="score-name">{player.name}</span>
                  <span className="score-points">0 pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-close" onClick={() => setShowSettings(false)}>✕</div>
            <h2>⚙️ Settings</h2>
            <div className="settings-options">
              <button className="setting-option" onClick={() => navigate('/')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Leave Game
              </button>
              <button className="setting-option" onClick={() => navigate(`/room/${roomId}`)}>
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
