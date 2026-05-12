import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { gameAPI } from '../services/api'
import { 
  Package, Target, Crown, BarChart3, Settings, DoorOpen, Trophy, Skull, Hourglass, StopCircle
} from 'lucide-react'
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
    playerHands: {},
    playedCards: [],
    currentTurn: null,
    currentTurnIndex: 0,
    gameStarted: false,
    isShuffling: false,
    isDealing: false,
    dealingCardIndex: 0,
    // New fields
    scores: {},           // { playerId: totalScore }
    roundNumber: 1,
    eliminatedPlayers: [], // playerIds who exceeded maxPoints
    mustPickup: false,     // current player must pick up before turn ends
    hasPlayedCard: false,  // current player played a card this turn
    gameOver: false,
    gameWinner: null,      // player object who won the whole game
    // Synced round result - visible to ALL players
    roundResult: null,     // { winner, playerScores, newCumulativeScores, newlyEliminated, roundNumber, timestamp }
    roundHistory: [],      // array of round results for Game End summary
    gameEndedByHost: false, // flag when host manually ends the game
    gameEndSummary: null,   // { roundWinners, overallWinner, finalScores }
  })
  const [countdown, setCountdown] = useState(30)
  const [showScoreboard, setShowScoreboard] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showGameEndSummary, setShowGameEndSummary] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [draggingCard, setDraggingCard] = useState(null)
  const [dropHover, setDropHover] = useState(false)
  const [showRoundResult, setShowRoundResult] = useState(false)
  const [showGameWin, setShowGameWin] = useState(null)         // { winnerName }
  const [showGameLoss, setShowGameLoss] = useState(false)      // current user got eliminated
  const [lastSeenRoundTimestamp, setLastSeenRoundTimestamp] = useState(null) // prevent re-showing same round result
  const navigate = useNavigate()
  const roomId = searchParams.get('roomId')

  useEffect(() => {
    fetchCurrentUser()
    if (roomId) {
      fetchRoomDetails()
    } else {
      // No roomId in URL, redirect home
      setLoading(false)
      navigate('/')
      return
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
          scores: data.gameState.scores || prev.scores,
          roundNumber: data.gameState.roundNumber ?? prev.roundNumber,
          eliminatedPlayers: data.gameState.eliminatedPlayers || prev.eliminatedPlayers,
          mustPickup: data.gameState.mustPickup ?? prev.mustPickup,
          hasPlayedCard: data.gameState.hasPlayedCard ?? prev.hasPlayedCard,
          gameOver: data.gameState.gameOver ?? prev.gameOver,
          gameWinner: data.gameState.gameWinner || prev.gameWinner,
          roundResult: data.gameState.roundResult || null,
          roundHistory: data.gameState.roundHistory || prev.roundHistory || [],
          gameEndedByHost: data.gameState.gameEndedByHost ?? prev.gameEndedByHost,
          gameEndSummary: data.gameState.gameEndSummary || prev.gameEndSummary,
          gameStarted: true,
          isShuffling: data.gameState.isShuffling ?? false,
          isDealing: data.gameState.isDealing ?? false
        }))
        
        // Show round result overlay if we haven't seen this one yet
        if (data.gameState.roundResult && data.gameState.roundResult.timestamp) {
          setLastSeenRoundTimestamp(prev => {
            if (prev !== data.gameState.roundResult.timestamp) {
              setShowRoundResult(true)
              // Auto-dismiss after 3.5s
              setTimeout(() => setShowRoundResult(false), 3500)
              return data.gameState.roundResult.timestamp
            }
            return prev
          })
        }
        
        // Check if current user got eliminated
        if (data.gameState.eliminatedPlayers && currentUser) {
          if (data.gameState.eliminatedPlayers.includes(currentUser.id)) {
            setShowGameLoss(true)
          }
        }
        
        // Check if game is over with a winner
        if (data.gameState.gameOver && data.gameState.gameWinner) {
          setShowGameWin({ winnerName: data.gameState.gameWinner.name })
        }

        // Check if host ended the game
        if (data.gameState.gameEndedByHost && data.gameState.gameEndSummary) {
          setShowGameEndSummary(true)
        }
        
        // Sync countdown from server timestamp
        if (data.gameState.countdownTimestamp) {
          const elapsed = Math.floor((Date.now() - data.gameState.countdownTimestamp) / 1000)
          const remaining = Math.max(0, 30 - elapsed)
          setCountdown(remaining)
        }
      }
    } catch (error) {
      console.error('Error fetching game state:', error)
      if (error?.response?.status === 500 || error?.status === 500) {
        // Room likely doesn't exist anymore
        navigate('/')
      }
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
        // Initialize scores for all players
        const initialScores = {}
        roomDetails.players.forEach(p => { initialScores[p.id] = 0 })
        
        const newState = {
          deck: remainingDeck,
          playerHands: newPlayerHands,
          playedCards: [],
          currentTurn: roomDetails.players[0]?.id,
          currentTurnIndex: 0,
          gameStarted: true,
          isShuffling: false,
          isDealing: false,
          countdownTimestamp: Date.now(),
          scores: initialScores,
          roundNumber: 1,
          eliminatedPlayers: [],
          mustPickup: false,
          hasPlayedCard: false,
          gameOver: false,
          gameWinner: null,
          roundResult: null,
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
    if (!gameState.gameStarted || !roomDetails?.players || gameState.gameOver) return
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        const newCount = prev - 1
        
        // Auto-advance if time is up and it's my turn
        if (newCount <= 0 && isMyTurn()) {
          // Auto pickup if they haven't yet
          if (gameState.hasPlayedCard && gameState.mustPickup) {
            handlePickupCard()
          } else {
            handleAutoEndTurn()
          }
          return 30
        }
        
        return newCount > 0 ? newCount : prev
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [gameState.gameStarted, gameState.currentTurnIndex, gameState.mustPickup, gameState.hasPlayedCard, roomDetails?.players])

  const fetchCurrentUser = () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'))
      if (userData) setCurrentUser(userData)
    } catch {
      // Invalid data in localStorage, ignore
    }
  }

  const fetchRoomDetails = async () => {
    try {
      const response = await gameAPI.getRoomDetails(roomId)
      setRoomDetails(response)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching room details:', err)
      setLoading(false)
      if (err?.response?.status === 404 || err?.status === 404) {
        navigate('/')
      }
    }
  }

  // Get active (non-eliminated) players
  const getActivePlayers = () => {
    if (!roomDetails?.players) return []
    return roomDetails.players.filter(p => !gameState.eliminatedPlayers.includes(p.id))
  }

  const handleNextTurn = async (stateOverride = null) => {
    if (!roomDetails?.players) return
    
    const activePlayers = getActivePlayers()
    if (activePlayers.length === 0) return
    
    const baseState = stateOverride || gameState
    const currentActiveIndex = activePlayers.findIndex(p => p.id === baseState.currentTurn)
    const nextActiveIndex = (currentActiveIndex + 1) % activePlayers.length
    const nextPlayer = activePlayers[nextActiveIndex]
    
    const updatedState = {
      ...baseState,
      currentTurn: nextPlayer.id,
      currentTurnIndex: roomDetails.players.findIndex(p => p.id === nextPlayer.id),
      gameStarted: true,
      countdownTimestamp: Date.now(),
      mustPickup: false,
      hasPlayedCard: false,
      isShuffling: false,
      isDealing: false
    }
    
    setGameState(updatedState)
    setCountdown(30)
    setSelectedCard(null)
    
    try {
      await gameAPI.updateGameState(roomId, updatedState)
    } catch (error) {
      console.error('Error updating game state:', error)
    }
  }

  // Auto end turn when timer runs out - pickup if needed, then advance
  const handleAutoEndTurn = () => {
    if (!isMyTurn()) return
    handleNextTurn()
  }

  // Pick up a random card from the deck
  const handlePickupCard = async () => {
    if (!isMyTurn() || !currentUser) return
    if (gameState.deck.length === 0) {
      // No cards to pick up, just advance turn
      handleNextTurn()
      return
    }

    const myId = currentUser.id
    const newDeck = [...gameState.deck]
    const randomIndex = Math.floor(Math.random() * newDeck.length)
    const pickedCard = newDeck.splice(randomIndex, 1)[0]

    const newHand = [...(gameState.playerHands[myId] || []), pickedCard]

    const updatedHands = {
      ...gameState.playerHands,
      [myId]: newHand
    }

    // After pickup, advance turn
    const activePlayers = getActivePlayers()
    const currentActiveIndex = activePlayers.findIndex(p => p.id === gameState.currentTurn)
    const nextActiveIndex = (currentActiveIndex + 1) % activePlayers.length
    const nextPlayer = activePlayers[nextActiveIndex]

    const updatedState = {
      ...gameState,
      deck: newDeck,
      playerHands: updatedHands,
      currentTurn: nextPlayer.id,
      currentTurnIndex: roomDetails.players.findIndex(p => p.id === nextPlayer.id),
      mustPickup: false,
      hasPlayedCard: false,
      countdownTimestamp: Date.now(),
      gameStarted: true,
      isShuffling: false,
      isDealing: false
    }

    setGameState(updatedState)
    setCountdown(30)
    setSelectedCard(null)

    try {
      await gameAPI.updateGameState(roomId, updatedState)
    } catch (error) {
      console.error('Error picking up card:', error)
    }
  }

  const handleMove = () => {
    if (!isMyTurn()) return
    // Move = skip turn (just advance)
    handleNextTurn()
  }

  // LowXena button: can only be pressed when hand points <= 10
  const handleLowXena = async () => {
    if (!isMyTurn() || !currentUser || !roomDetails?.players) return

    const myId = currentUser.id
    const myHand = gameState.playerHands[myId] || []
    const myPoints = calculateHandPoints(myHand)

    if (myPoints > 10) {
      return
    }

    // Compare all active players' hand points
    const activePlayers = getActivePlayers()
    const playerScoresThisRound = activePlayers.map(p => ({
      id: p.id,
      name: p.name,
      handPoints: calculateHandPoints(gameState.playerHands[p.id] || [])
    }))

    // Find the lowest points (the round winner)
    const minPoints = Math.min(...playerScoresThisRound.map(p => p.handPoints))
    const roundWinner = playerScoresThisRound.find(p => p.handPoints === minPoints)

    // Calculate new cumulative scores
    const newScores = { ...(gameState.scores || {}) }
    playerScoresThisRound.forEach(p => {
      if (!newScores[p.id]) newScores[p.id] = 0
      newScores[p.id] += p.handPoints
    })

    // Round winner gets their score reset to 0
    if (roundWinner) {
      newScores[roundWinner.id] = 0
    }

    // Check for eliminations
    const maxPoints = roomDetails.maxPoints || 40
    const newEliminated = [...gameState.eliminatedPlayers]
    const newlyEliminated = []

    activePlayers.forEach(p => {
      if (newScores[p.id] >= maxPoints && !newEliminated.includes(p.id)) {
        newEliminated.push(p.id)
        newlyEliminated.push(p)
      }
    })

    // Check remaining players after elimination
    const remainingPlayers = roomDetails.players.filter(p => !newEliminated.includes(p.id))

    let gameOver = false
    let gameWinner = null

    if (remainingPlayers.length <= 1) {
      gameOver = true
      gameWinner = remainingPlayers[0] || null
    }

    // Build the round result object (synced to all players)
    const roundResultData = {
      winner: roundWinner,
      playerScores: playerScoresThisRound,
      newCumulativeScores: newScores,
      newlyEliminated,
      roundNumber: gameState.roundNumber,
      calledBy: { id: myId, name: currentUser.name },
      timestamp: Date.now(), // unique key so all clients detect it
    }

    // Save round result + updated scores into game state so ALL players see it
    const roundResultState = {
      ...gameState,
      scores: newScores,
      eliminatedPlayers: newEliminated,
      roundResult: roundResultData,
      roundHistory: [...(gameState.roundHistory || []), roundResultData],
      gameOver,
      gameWinner,
    }

    setGameState(roundResultState)
    setShowRoundResult(true)
    setLastSeenRoundTimestamp(roundResultData.timestamp)

    try {
      await gameAPI.updateGameState(roomId, roundResultState)
    } catch (err) {
      console.error('Error saving round result:', err)
    }

    // After 3.5s, dismiss overlay and proceed
    setTimeout(() => {
      setShowRoundResult(false)

      if (gameOver) {
        if (gameWinner) setShowGameWin({ winnerName: gameWinner.name })
        if (currentUser && newEliminated.includes(currentUser.id)) setShowGameLoss(true)
        return
      }

      // Show eliminated notification
      if (newlyEliminated.length > 0) {
        if (newlyEliminated.some(p => p.id === currentUser?.id)) {
          setShowGameLoss(true)
        }
      }

      // Only the player who called LowXena triggers the new round (acts as coordinator)
      startNewRound(newScores, newEliminated, gameState.roundNumber + 1)
    }, 3500)
  }

  // Start a new round with reshuffle and redeal
  const startNewRound = async (scores, eliminated, roundNumber) => {
    const remaining = roomDetails.players.filter(p => !eliminated.includes(p.id))
    if (remaining.length <= 1) return

    // Create new shuffled deck
    const fullDeck = []
    SUITS.forEach(suit => {
      VALUES.forEach(value => {
        fullDeck.push({
          suit, value,
          id: `${value}-${suit}-r${roundNumber}`,
          color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black'
        })
      })
    })
    const shuffledDeck = shuffleArray(fullDeck)

    // Show shuffle animation
    setGameState(prev => ({ ...prev, isShuffling: true }))

    setTimeout(() => {
      // Deal 7 cards to each remaining player
      const cardsPerPlayer = 7
      const newPlayerHands = {}
      remaining.forEach((player, index) => {
        newPlayerHands[player.id] = shuffledDeck.slice(index * cardsPerPlayer, (index + 1) * cardsPerPlayer)
      })
      // Eliminated players get empty hands
      eliminated.forEach(id => { newPlayerHands[id] = [] })

      const remainingDeck = shuffledDeck.slice(remaining.length * cardsPerPlayer)

      setGameState(prev => ({ ...prev, isDealing: true, isShuffling: false }))

      setTimeout(async () => {
        const newState = {
          deck: remainingDeck,
          playerHands: newPlayerHands,
          playedCards: [],
          currentTurn: remaining[0]?.id,
          currentTurnIndex: roomDetails.players.findIndex(p => p.id === remaining[0]?.id),
          gameStarted: true,
          isShuffling: false,
          isDealing: false,
          countdownTimestamp: Date.now(),
          scores: scores,
          roundNumber: roundNumber,
          eliminatedPlayers: eliminated,
          mustPickup: false,
          hasPlayedCard: false,
          gameOver: false,
          gameWinner: null,
          roundResult: null,  // Clear round result for all players
        }

        setGameState(newState)
        setCountdown(30)
        setSelectedCard(null)

        try {
          await gameAPI.updateGameState(roomId, newState)
        } catch (err) {
          console.error('Error saving new round state:', err)
        }
      }, 1500)
    }, 2000)
  }

  // Play a card (or two same-value cards) from hand to the table
  const handlePlayCard = async (card) => {
    if (!isMyTurn() || !card || !currentUser) return
    if (gameState.hasPlayedCard) return // Already played this turn, must pickup

    const myId = currentUser.id
    const myHand = gameState.playerHands[myId]
    if (!myHand) return

    const cardIndex = myHand.findIndex(c => c.id === card.id)
    if (cardIndex === -1) return

    // Find ALL cards with the same value (play 2, 3, or 4 at once)
    const cardsToPlay = myHand.filter(c => c.value === card.value)
    const newHand = myHand.filter(c => c.value !== card.value)

    const updatedHands = {
      ...gameState.playerHands,
      [myId]: newHand
    }

    const updatedPlayed = [...gameState.playedCards, ...cardsToPlay]

    // Don't advance turn yet - must pickup first
    const updatedState = {
      ...gameState,
      playerHands: updatedHands,
      playedCards: updatedPlayed,
      mustPickup: true,
      hasPlayedCard: true,
      gameStarted: true,
      isShuffling: false,
      isDealing: false
    }

    setGameState(updatedState)
    setSelectedCard(null)
    setDraggingCard(null)

    try {
      await gameAPI.updateGameState(roomId, updatedState)
    } catch (error) {
      console.error('Error playing card:', error)
    }
  }

  // Click a card to select it, click again or click played area to play it
  const handleCardClick = (card) => {
    if (!isMyTurn()) return
    if (selectedCard && selectedCard.id === card.id) {
      // Clicking the same card again deselects
      setSelectedCard(null)
    } else {
      setSelectedCard(card)
    }
  }

  // Drag handlers
  const handleDragStart = (e, card) => {
    if (!isMyTurn()) return
    setDraggingCard(card)
    setSelectedCard(null)
    e.dataTransfer.setData('text/plain', card.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggingCard(null)
    setDropHover(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropHover(true)
  }

  const handleDragLeave = () => {
    setDropHover(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDropHover(false)
    if (draggingCard) {
      handlePlayCard(draggingCard)
    }
  }

  // Click on played area to play selected card
  const handlePlayedAreaClick = () => {
    if (selectedCard && isMyTurn()) {
      handlePlayCard(selectedCard)
    }
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
    if (!window.confirm('Are you sure you want to end this game? Round-wise results will be saved.')) return

    try {
      const history = gameState.roundHistory || []
      
      // Count round wins per player
      const roundWins = {}
      history.forEach(r => {
        if (r.winner) {
          if (!roundWins[r.winner.id]) roundWins[r.winner.id] = { ...r.winner, wins: 0 }
          roundWins[r.winner.id].wins++
        }
      })

      // Determine overall winner (most round wins)
      const sortedWinners = Object.values(roundWins).sort((a, b) => b.wins - a.wins)
      const overallWinner = sortedWinners[0] || null

      // Final scores from current game state
      const finalScores = gameState.scores || {}

      const summary = {
        roundWinners: history.map(r => ({
          round: r.roundNumber,
          winnerName: r.winner?.name || 'N/A',
          winnerId: r.winner?.id,
          calledBy: r.calledBy?.name,
        })),
        overallWinner: overallWinner ? { name: overallWinner.name, id: overallWinner.id, roundWins: overallWinner.wins } : null,
        finalScores,
        totalRounds: history.length,
      }

      // Update game state to signal game ended by host
      const endedState = {
        ...gameState,
        gameOver: true,
        gameEndedByHost: true,
        gameEndSummary: summary,
      }

      setGameState(endedState)
      setShowSettings(false)
      setShowGameEndSummary(true)

      await gameAPI.updateGameState(roomId, endedState)

      // Reset room status to waiting so players can go back to lobby
      try {
        await gameAPI.endGame(roomId)
      } catch (e) {
        console.error('Error resetting room:', e)
      }

      // Save multiplayer results for all players
      if (roomDetails?.players) {
        try {
          await gameAPI.saveMultiplayerResults({
            players: roomDetails.players.map(player => ({
              id: player.id,
              score: finalScores[player.id] || 0,
              isWinner: overallWinner?.id === player.id,
            })),
            totalRounds: history.length,
          })
        } catch (e) {
          console.error('Error saving multiplayer results:', e)
        }
      }
    } catch (err) {
      console.error('Error ending game:', err)
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
      ],
      // 6 players: 5 other players
      [
        { top: '50%', left: '6%', transform: 'translate(0, -50%)' },
        { top: '20%', left: '22%', transform: 'translate(-50%, 0)' },
        { top: '15%', left: '50%', transform: 'translate(-50%, 0)' },
        { top: '20%', right: '22%', transform: 'translate(50%, 0)' },
        { top: '50%', right: '6%', transform: 'translate(0, -50%)' }
      ],
      // 7 players: 6 other players
      [
        { top: '55%', left: '5%', transform: 'translate(0, -50%)' },
        { top: '30%', left: '10%', transform: 'translate(0, -50%)' },
        { top: '15%', left: '35%', transform: 'translate(-50%, 0)' },
        { top: '15%', right: '35%', transform: 'translate(50%, 0)' },
        { top: '30%', right: '10%', transform: 'translate(0, -50%)' },
        { top: '55%', right: '5%', transform: 'translate(0, -50%)' }
      ]
    ]
    
    const positionSet = positions[total - 1] || positions[positions.length - 1]
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
            <span className="round-badge">R{gameState.roundNumber}</span>
            <span className="turn-label">
              {isMyTurn() 
                ? (gameState.mustPickup ? <><Package size={14} /> Pick Up a Card!</> : <><Target size={14} /> Your Turn</>) 
                : <><Hourglass size={14} /> {getCurrentTurnPlayer()?.name}'s Turn</>}
            </span>
            <span className="turn-timer">{countdown}s</span>
          </div>
        )}

        {isHost() && gameState.gameStarted && !gameState.gameOver && (
          <button 
            className="control-btn end-game-btn"
            onClick={handleEndGame}
            title="End Game"
          >
            <StopCircle size={20} />
          </button>
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

      {/* Casino Table Area with Players Around It */}
      <div className="casino-area">
        {/* Opponent seats positioned around the table */}
        {otherPlayers.map((player, index) => (
          <div 
            key={player.id} 
            className={`seat seat-${index} seat-of-${otherPlayers.length} ${gameState.currentTurn === player.id ? 'active-turn' : ''} ${gameState.eliminatedPlayers.includes(player.id) ? 'eliminated' : ''}`}
          >
            <div className="seat-avatar">
              {player.avatarUrl ? (
                <img src={player.avatarUrl} alt={player.name} referrerPolicy="no-referrer" />
              ) : (
                <span className="seat-letter">{player.name?.charAt(0).toUpperCase()}</span>
              )}
              {player.isHost && <span className="crown-badge"><Crown size={12} /></span>}
              {gameState.eliminatedPlayers.includes(player.id) && <span className="eliminated-badge">✕</span>}
            </div>
            <div className="seat-info">
              <span className="seat-name">{player.name}</span>
              <span className="seat-score">{gameState.scores?.[player.id] || 0} pts</span>
              <span className="seat-cards">{gameState.playerHands[player.id]?.length || 0} cards</span>
            </div>
          </div>
        ))}

        {/* Central Game Table */}
        <div className="game-table">
          <div className="table-surface">
            <div className="table-felt"></div>
          
          {/* Deck - click to pick up */}
          <div className={`deck-area ${gameState.mustPickup && isMyTurn() ? 'deck-pickup-ready' : ''}`}
            onClick={() => {
              if (gameState.mustPickup && isMyTurn()) {
                handlePickupCard()
              }
            }}
          >
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
            <span className="deck-label">
              {gameState.deck.length}
              {gameState.mustPickup && isMyTurn() && <span className="pickup-hint"> ← Pick up!</span>}
            </span>
          </div>

          {/* Played Cards */}
          <div 
            className={`played-area ${dropHover ? 'drop-hover' : ''} ${selectedCard && isMyTurn() ? 'can-drop' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handlePlayedAreaClick}
          >
            {gameState.playedCards.length === 0 ? (
              <div className="play-placeholder">
                {selectedCard && isMyTurn() ? 'Tap to play' : 'Play here'}
              </div>
            ) : (
              gameState.playedCards.slice(-3).map((card, index) => (
                <div key={card.id} className="played-card" style={{ 
                  transform: `rotate(${(index * 7) - 7}deg) translateX(${(index - 1) * 12}px)`,
                  zIndex: index 
                }}>
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
              ))
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Action Buttons */}
      {gameState.gameStarted && !gameState.gameOver && (
        <div className="game-actions">
          {gameState.mustPickup && isMyTurn() ? (
            <button 
              className="action-btn btn-pickup pulse-btn"
              onClick={handlePickupCard}
            >
              Pick Up Card
            </button>
          ) : (
            <>
              <button 
                className={`action-btn btn-move ${!isMyTurn() || gameState.hasPlayedCard ? 'disabled' : ''}`}
                onClick={handleMove}
                disabled={!isMyTurn() || gameState.hasPlayedCard}
              >
                Move
              </button>
              <button 
                className={`action-btn btn-lowxena ${!isMyTurn() || calculateHandPoints(myCards) > 10 ? 'disabled' : ''}`}
                onClick={handleLowXena}
                disabled={!isMyTurn() || calculateHandPoints(myCards) > 10}
                title={calculateHandPoints(myCards) > 10 ? 'Need 10 or fewer points' : 'Call LowXena!'}
              >
                LowXena!
              </button>
            </>
          )}
        </div>
      )}

      {/* Current Player Hand */}
      {orderedPlayers[0] && (
        <div className="my-hand-section">
          <div className="my-info-bar">
            <div className="my-avatar">
              {orderedPlayers[0].avatarUrl ? (
                <img src={orderedPlayers[0].avatarUrl} alt={orderedPlayers[0].name} referrerPolicy="no-referrer" />
              ) : (
                <span className="my-avatar-letter">{orderedPlayers[0].name?.charAt(0).toUpperCase()}</span>
              )}
              {orderedPlayers[0].isHost && <span className="crown-badge"><Crown size={14} /></span>}
            </div>
            <div className="my-details">
              <span className="my-name">{orderedPlayers[0].name}</span>
              <span className="my-stats">{myCards?.length || 0} cards · {calculateHandPoints(myCards)} pts · Score: {gameState.scores?.[orderedPlayers[0]?.id] || 0}</span>
            </div>
          </div>
          <div className="my-cards-fan">
            {myCards?.map((card, i) => (
              <div 
                key={card.id} 
                className={`hand-card ${selectedCard?.id === card.id ? 'selected' : ''} ${draggingCard?.id === card.id ? 'dragging' : ''} ${!isMyTurn() ? 'not-my-turn' : ''}`}
                style={{ '--i': i, '--total': myCards.length }}
                draggable={isMyTurn()}
                onDragStart={(e) => handleDragStart(e, card)}
                onDragEnd={handleDragEnd}
                onClick={() => handleCardClick(card)}
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
            <h2 className="modal-heading"><BarChart3 size={20} style={{display:'inline', verticalAlign:'-3px', marginRight:'6px'}} /> Scoreboard</h2>
            <div className="round-info">Round {gameState.roundNumber} · Max {roomDetails?.maxPoints || 40} pts</div>
            <div className="scoreboard-list">
              {[...(roomDetails?.players || [])]
                .sort((a, b) => (gameState.scores?.[a.id] || 0) - (gameState.scores?.[b.id] || 0))
                .map((player, index) => (
                <div key={player.id} className={`score-row ${gameState.eliminatedPlayers.includes(player.id) ? 'score-eliminated' : ''}`}>
                  <span className="score-rank">#{index + 1}</span>
                  <span className="score-name">
                    {player.name}
                    {gameState.eliminatedPlayers.includes(player.id) && ' (OUT)'}
                  </span>
                  <span className="score-pts">{gameState.scores?.[player.id] || 0} pts</span>
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
            <h2 className="modal-heading"><Settings size={20} style={{display:'inline', verticalAlign:'-3px', marginRight:'6px'}} /> Settings</h2>
            <div className="settings-list">
              {isHost() && gameState.gameStarted && !gameState.gameOver && (
                <button className="settings-item end-game-settings-btn" onClick={handleEndGame}>
                  <StopCircle size={16} /> End Game
                </button>
              )}
              <button className="settings-item" onClick={async () => {
                try { await gameAPI.leaveRoom(roomId) } catch(e) {}
                navigate('/')
              }}>
                <DoorOpen size={16} /> Leave Game
              </button>
              <button className="settings-item" onClick={() => {
                setShowSettings(false)
                navigate(`/room/${roomId}`)
              }}>
                ← Back to Lobby
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Round Result Overlay — synced to ALL players */}
      {showRoundResult && gameState.roundResult && (
        <div className="overlay-screen round-result-overlay">
          <div className="overlay-content round-result-content">
            <h2 className="overlay-title">Round {gameState.roundResult.roundNumber} Complete!</h2>
            <div className="round-called-by">
              Called by <strong>{gameState.roundResult.calledBy?.name}</strong>
            </div>
            <div className="round-result-winner">
              <span className="trophy-icon"><Trophy size={28} /></span>
              <span>{gameState.roundResult.winner?.name} wins the round!</span>
            </div>
            <div className="round-scores-list">
              {gameState.roundResult.playerScores?.map(p => (
                <div key={p.id} className={`round-score-item ${p.id === gameState.roundResult.winner?.id ? 'round-winner-row' : ''}`}>
                  <span className="round-score-name">
                    {p.name}
                    {p.id === gameState.roundResult.winner?.id && <> <Trophy size={14} /></>}
                  </span>
                  <span className="round-score-hand">Hand: {p.handPoints} pts</span>
                  <span className="round-score-total">Total: {gameState.roundResult.newCumulativeScores?.[p.id] || 0} pts</span>
                </div>
              ))}
            </div>
            {gameState.roundResult.newlyEliminated?.length > 0 && (
              <div className="round-eliminated">
                {gameState.roundResult.newlyEliminated.map(p => (
                  <span key={p.id} className="eliminated-name"><Skull size={16} /> {p.name} eliminated!</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Win Screen */}
      {showGameWin && (
        <div className="overlay-screen game-win-overlay">
          <div className="overlay-content game-win-content">
            <div className="win-trophy"><Trophy size={48} /></div>
            <h2 className="overlay-title game-win-title">
              {showGameWin.winnerName === currentUser?.name ? 'You Win!' : `${showGameWin.winnerName} Wins!`}
            </h2>
            <p className="win-subtitle">Game Over</p>
            <button className="win-btn" onClick={() => {
              setShowGameWin(false)
              navigate(`/room/${roomId}`)
            }}>
              Back to Lobby
            </button>
          </div>
        </div>
      )}

      {/* Game Loss Screen */}
      {showGameLoss && !showGameWin && !showGameEndSummary && (
        <div className="overlay-screen game-loss-overlay">
          <div className="overlay-content game-loss-content">
            <div className="loss-icon"><Skull size={48} /></div>
            <h2 className="overlay-title game-loss-title">You've Been Eliminated!</h2>
            <p className="loss-subtitle">Your score exceeded {roomDetails?.maxPoints || 40} points</p>
            <div className="loss-actions">
              <button className="loss-btn" onClick={() => setShowGameLoss(false)}>
                Watch Game
              </button>
              <button className="loss-btn loss-btn-leave" onClick={() => {
                setShowGameLoss(false)
                navigate(`/room/${roomId}`)
              }}>
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game End Summary — shown when host ends the game */}
      {showGameEndSummary && gameState.gameEndSummary && (
        <div className="overlay-screen game-end-overlay">
          <div className="overlay-content game-end-content">
            <div className="game-end-trophy"><Trophy size={40} /></div>
            <h2 className="overlay-title game-end-title">Game Over</h2>
            {gameState.gameEndSummary.overallWinner && (
              <div className="game-end-winner">
                <Crown size={20} />
                <span><strong>{gameState.gameEndSummary.overallWinner.name}</strong> wins with {gameState.gameEndSummary.overallWinner.roundWins} round{gameState.gameEndSummary.overallWinner.roundWins !== 1 ? 's' : ''} won!</span>
              </div>
            )}
            {gameState.gameEndSummary.totalRounds === 0 && (
              <p className="game-end-no-rounds">No rounds were completed.</p>
            )}
            {gameState.gameEndSummary.totalRounds > 0 && (
              <div className="game-end-rounds">
                <h3 className="game-end-rounds-title">Round History</h3>
                <div className="game-end-rounds-list">
                  {gameState.gameEndSummary.roundWinners.map((r) => (
                    <div key={r.round} className="game-end-round-row">
                      <span className="game-end-round-num">R{r.round}</span>
                      <span className="game-end-round-winner"><Trophy size={14} /> {r.winnerName}</span>
                      <span className="game-end-round-caller">Called by {r.calledBy}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {roomDetails?.players && (
              <div className="game-end-final-scores">
                <h3 className="game-end-scores-title">Final Scores</h3>
                {[...(roomDetails.players)]
                  .sort((a, b) => (gameState.gameEndSummary.finalScores[a.id] || 0) - (gameState.gameEndSummary.finalScores[b.id] || 0))
                  .map(p => (
                    <div key={p.id} className={`game-end-score-row ${p.id === gameState.gameEndSummary.overallWinner?.id ? 'game-end-score-winner' : ''}`}>
                      <span className="game-end-score-name">
                        {p.name}
                        {p.id === gameState.gameEndSummary.overallWinner?.id && <Crown size={14} />}
                      </span>
                      <span className="game-end-score-pts">{gameState.gameEndSummary.finalScores[p.id] || 0} pts</span>
                    </div>
                  ))}
              </div>
            )}
            <button className="win-btn" onClick={() => {
              setShowGameEndSummary(false)
              navigate(`/room/${roomId}`)
            }}>
              Back to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Game
