import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { gameAPI } from '../services/api'
import { getCardImage, getCardBack } from '../utils/cardImages'
import { 
  Package, Target, Crown, BarChart3, Settings, DoorOpen, Trophy, Skull, Hourglass, StopCircle,
  BookOpen, X, Flame, Zap, AlertTriangle, Coins, MessageSquare
} from 'lucide-react'
import Loader from '../components/Loader'
import { AvatarSVG, isAvatarSVG } from '../components/Avatars'
import { Fireworks } from 'fireworks-js'
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
    roundResult: null,     // { winner, playerScores, newCumulativeScores, newlyEliminated, roundNumber, timestamp }
    roundHistory: [],      // array of round results for Game End summary
    gameEndedByHost: false, // flag when host manually ends the game
    gameEndSummary: null,   // { roundWinners, overallWinner, finalScores }
    cursedNumber: null,     // dynamic cursed card rank for the round
    lastCursedPlay: null,   // tracks latest cursed card drop event
    activeReactions: {},    // player emoji reactions { playerId: { emoji, timestamp } }
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

  // Polling cooldown refs to prevent state rubber-banding
  const pollCooldownRef = useRef(false)
  const pollCooldownTimeoutRef = useRef(null)

  // Fireworks animation on win
  const fireworksRef = useRef(null)
  const fireworksInstance = useRef(null)

  useEffect(() => {
    const hasWon = showGameWin && showGameWin.winnerName && currentUser?.name && 
      showGameWin.winnerName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()

    if (hasWon && fireworksRef.current) {
      if (!fireworksInstance.current) {
        fireworksInstance.current = new Fireworks(fireworksRef.current, {
          autoresize: true,
          opacity: 0.5,
          acceleration: 1.05,
          friction: 0.98,
          gravity: 1.5,
          particles: 80,
          explosion: 6,
          intensity: 30,
          traceSpeed: 3,
        })
        fireworksInstance.current.start()
      }
    } else {
      if (fireworksInstance.current) {
        fireworksInstance.current.stop()
        fireworksInstance.current = null
      }
    }

    return () => {
      if (fireworksInstance.current) {
        fireworksInstance.current.stop()
        fireworksInstance.current = null
      }
    }
  }, [showGameWin, currentUser])

  // Cursed Card Twist states & timers
  const [lastSeenCursedRound, setLastSeenCursedRound] = useState(0)
  const [showCursedPop, setShowCursedPop] = useState(false)
  const [lastSeenCursedPlayTimestamp, setLastSeenCursedPlayTimestamp] = useState(null)
  const [cursedPlayToast, setCursedPlayToast] = useState(null)

  // Emoji reaction states & helpers
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const REACTION_EMOJIS = ['😂', '😮', '😡', '😭', '😎']

  const getFreshReaction = (playerId) => {
    const rx = gameState.activeReactions?.[playerId]
    if (!rx) return null
    // If reaction was sent within the last 4 seconds, return it
    if (Math.abs(Date.now() - rx.timestamp) < 4000) {
      return rx.emoji
    }
    return null
  }

  const handleSendEmoji = async (emoji) => {
    if (!currentUser) return
    const myId = currentUser.id
    
    const now = Date.now()
    const updatedReactions = {
      ...(gameState.activeReactions || {}),
      [myId]: { emoji, timestamp: now }
    }
    
    const updatedState = {
      ...gameState,
      activeReactions: updatedReactions
    }
    
    setShowEmojiPicker(false)
    await saveAndPublishGameState(updatedState)
  }

  // Trigger Cursed Card round start announcement
  useEffect(() => {
    if (gameState.gameStarted && gameState.cursedNumber && gameState.roundNumber !== lastSeenCursedRound) {
      setLastSeenCursedRound(gameState.roundNumber)
      setShowCursedPop(true)
    }
  }, [gameState.gameStarted, gameState.cursedNumber, gameState.roundNumber, lastSeenCursedRound])

  // Independent close timer for the popup - avoids getting prematurely cleared on gameState poll updates
  useEffect(() => {
    if (showCursedPop) {
      const timer = setTimeout(() => {
        setShowCursedPop(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showCursedPop])

  // Trigger Synced Cursed Card Drop alert toast
  useEffect(() => {
    if (gameState.lastCursedPlay && gameState.lastCursedPlay.timestamp) {
      if (gameState.lastCursedPlay.timestamp !== lastSeenCursedPlayTimestamp) {
        setLastSeenCursedPlayTimestamp(gameState.lastCursedPlay.timestamp)
        setCursedPlayToast(gameState.lastCursedPlay)
      }
    }
  }, [gameState.lastCursedPlay, lastSeenCursedPlayTimestamp])

  // Independent timer for drop toast
  useEffect(() => {
    if (cursedPlayToast) {
      const timer = setTimeout(() => {
        setCursedPlayToast(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [cursedPlayToast])
  const roomId = searchParams.get('roomId')

  // Unified helper to set state, cache locally, trigger polling freeze, and save to server
  const saveAndPublishGameState = async (updatedState) => {
    // 1. Optimistic UI update
    setGameState(updatedState)
    
    // 2. Local stale-while-revalidate caching
    if (roomId) {
      try {
        localStorage.setItem(`game_state_cache_${roomId}`, JSON.stringify(updatedState))
      } catch (e) {
        console.error('Error writing game state cache:', e)
      }
    }
    
    // 3. Initiate polling cooldown to prevent rubber-banding
    pollCooldownRef.current = true
    if (pollCooldownTimeoutRef.current) {
      clearTimeout(pollCooldownTimeoutRef.current)
    }
    pollCooldownTimeoutRef.current = setTimeout(() => {
      pollCooldownRef.current = false
    }, 2200)
    
    // 4. Save state to MongoDB server
    try {
      await gameAPI.updateGameState(roomId, updatedState)
    } catch (error) {
      console.error('Error updating game state:', error)
      pollCooldownRef.current = false // Release cooldown on failure
    }
  }

  useEffect(() => {
    fetchCurrentUser()
    if (roomId) {
      // Instant paint using local storage caches (stale-while-revalidate pattern)
      const cachedRoom = localStorage.getItem(`room_details_cache_${roomId}`)
      if (cachedRoom) {
        try {
          const parsed = JSON.parse(cachedRoom)
          setRoomDetails(parsed)
          setLoading(false)
        } catch (e) {
          console.error('Error parsing cached room details:', e)
        }
      }
      
      const cachedState = localStorage.getItem(`game_state_cache_${roomId}`)
      if (cachedState) {
        try {
          const parsed = JSON.parse(cachedState)
          setGameState(parsed)
        } catch (e) {
          console.error('Error parsing cached game state:', e)
        }
      }

      fetchRoomDetails()
    } else {
      // No roomId in URL, redirect home
      setLoading(false)
      navigate('/')
      return
    }
    
    // Poll for game updates
    let pollCount = 0
    const interval = setInterval(() => {
      if (roomId) {
        pollCount++
        // Poll room details only once every 8 cycles (12 seconds) to minimize server load
        if (pollCount % 8 === 0) {
          fetchRoomDetails()
        }
        
        // Skip fetching game state if client is in polling freeze cooldown
        if (!pollCooldownRef.current) {
          fetchGameState()
        }
      }
    }, 1500)
    
    return () => {
      clearInterval(interval)
      if (pollCooldownTimeoutRef.current) {
        clearTimeout(pollCooldownTimeoutRef.current)
      }
    }
  }, [roomId])

  // Once we have room details and current user, check if we need to initialize
  useEffect(() => {
    if (roomDetails && currentUser && roomId) {
      if (!pollCooldownRef.current) {
        fetchGameState()
      }
    }
  }, [roomDetails?.id, currentUser?.id])

  // Sync game state across all players
  const fetchGameState = async () => {
    if (!roomId) return
    if (pollCooldownRef.current) return
    
    try {
      const data = await gameAPI.getGameState(roomId)
      
      if (data && data.gameState && data.gameState.gameStarted) {
        // Cache game state to localStorage
        try {
          localStorage.setItem(`game_state_cache_${roomId}`, JSON.stringify(data.gameState))
        } catch (e) {
          console.error('Error caching fetched game state:', e)
        }

        setGameState(prev => {
          // Double check if poll cooldown got activated during the fetch
          if (pollCooldownRef.current) return prev;

          return {
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
            cursedNumber: data.gameState.cursedNumber || null,
            lastCursedPlay: data.gameState.lastCursedPlay || null,
            activeReactions: data.gameState.activeReactions || {},
            gameStarted: true,
            isShuffling: data.gameState.isShuffling ?? false,
            isDealing: data.gameState.isDealing ?? false
          }
        })
        
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
      
      // Initialize scores for all players
      const initialScores = {}
      roomDetails.players.forEach(p => { initialScores[p.id] = 0 })
      
      const cursedPool = ['A', '2', '3', '4', '5']
      const randomCursed = cursedPool[Math.floor(Math.random() * cursedPool.length)]
      
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
        cursedNumber: randomCursed,
        lastCursedPlay: null,
      }
      
      setCountdown(30)
      
      // Save full game state using optimized save helper
      saveAndPublishGameState(newState)
        .catch(err => console.error('Error saving game state:', err))
    }, 2000)
  }, [roomDetails?.players?.length, currentUser?.id, gameState.gameStarted])

  // When the game ends naturally, the host automatically calls gameAPI.endGame(roomId) after a short delay
  // to reset the room's status on the backend to 'waiting', allowing all players to safely navigate back to the lobby.
  useEffect(() => {
    if (gameState.gameOver && !gameState.gameEndedByHost && isHost() && roomId) {
      const resetRoomTimer = setTimeout(async () => {
        try {
          await gameAPI.endGame(roomId)
        } catch (e) {
          console.error('Error auto-resetting room to lobby:', e)
        }
      }, 5000) // 5 second delay to ensure all players' clients have fetched the gameWinner and gameOver state

      return () => clearTimeout(resetRoomTimer)
    }
  }, [gameState.gameOver, gameState.gameEndedByHost, roomId, roomDetails?.hostId, currentUser?.id])

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
      try {
        localStorage.setItem(`room_details_cache_${roomId}`, JSON.stringify(response))
      } catch (e) {
        console.error('Error caching room details:', e)
      }
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
    
    setCountdown(30)
    setSelectedCard(null)
    
    await saveAndPublishGameState(updatedState)
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
      await handleNextTurn()
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

    setCountdown(30)
    setSelectedCard(null)

    await saveAndPublishGameState(updatedState)
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
    const playerScoresThisRound = activePlayers.map(p => {
      const hand = gameState.playerHands[p.id] || []
      const hasCursedCard = hand.some(c => c.value === gameState.cursedNumber)
      return {
        id: p.id,
        name: p.name,
        handPoints: hasCursedCard ? (roomDetails.maxPoints || 40) : calculateHandPoints(hand),
        hasCursedCard
      }
    })

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
      
      // Save multiplayer results for all players on natural game completion
      if (gameOver && roomDetails?.players) {
        try {
          await gameAPI.saveMultiplayerResults({
            players: roomDetails.players.map(player => ({
              id: player.id,
              score: newScores[player.id] || 0,
              isWinner: gameWinner?.id === player.id,
            })),
            totalRounds: roundResultState.roundHistory?.length || gameState.roundNumber,
          })
        } catch (e) {
          console.error('Error saving multiplayer results on natural game over:', e)
        }
      }
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

    setTimeout(async () => {
      // Deal 7 cards to each remaining player
      const cardsPerPlayer = 7
      const newPlayerHands = {}
      remaining.forEach((player, index) => {
        newPlayerHands[player.id] = shuffledDeck.slice(index * cardsPerPlayer, (index + 1) * cardsPerPlayer)
      })
      // Eliminated players get empty hands
      eliminated.forEach(id => { newPlayerHands[id] = [] })

      const remainingDeck = shuffledDeck.slice(remaining.length * cardsPerPlayer)

      const cursedPool = ['A', '2', '3', '4', '5']
      const randomCursed = cursedPool[Math.floor(Math.random() * cursedPool.length)]

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
        cursedNumber: randomCursed,
        lastCursedPlay: null,
      }

      setCountdown(30)
      setSelectedCard(null)

      await saveAndPublishGameState(newState)
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

    const isCursed = card.value === gameState.cursedNumber

    if (cardsToPlay.length > 1 || isCursed) {
      const stateOverride = {
        ...gameState,
        playerHands: updatedHands,
        playedCards: updatedPlayed,
        mustPickup: false,
        hasPlayedCard: false,
        ...(isCursed && {
          lastCursedPlay: {
            playerName: currentUser.name,
            cardValue: card.value,
            timestamp: Date.now()
          }
        })
      }
      setSelectedCard(null)
      setDraggingCard(null)
      await handleNextTurn(stateOverride)
    } else {
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

      setSelectedCard(null)
      setDraggingCard(null)

      await saveAndPublishGameState(updatedState)
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
    // Symmetrical Left/Right column layout for opponents
    // 2 players total (1 other): Left
    // 3 players total (2 others): 1 Left, 1 Right
    // 4 players total (3 others): 2 Left, 1 Right
    // 5 players total (4 others): 2 Left, 2 Right
    // 6 players total (5 others): 3 Left, 2 Right
    // 7 players total (6 others): 3 Left, 3 Right
    
    const positions = [
      // 2 players: 1 other player (Left)
      [{ top: '50%', left: 'var(--seat-left, 8%)', transform: 'translate(0, -50%)' }],
      // 3 players: 2 other players (1 Left, 1 Right)
      [
        { top: '50%', left: 'var(--seat-left, 8%)', transform: 'translate(0, -50%)' },
        { top: '50%', right: 'var(--seat-right, 8%)', transform: 'translate(0, -50%)' }
      ],
      // 4 players: 3 other players (2 Left, 1 Right)
      [
        { top: '25%', left: 'var(--seat-left, 8%)', transform: 'translate(0, -50%)' },
        { top: '75%', left: 'var(--seat-left, 8%)', transform: 'translate(0, -50%)' },
        { top: '50%', right: 'var(--seat-right, 8%)', transform: 'translate(0, -50%)' }
      ],
      // 5 players: 4 other players (2 Left, 2 Right)
      [
        { top: '25%', left: 'var(--seat-left, 8%)', transform: 'translate(0, -50%)' },
        { top: '75%', left: 'var(--seat-left, 8%)', transform: 'translate(0, -50%)' },
        { top: '25%', right: 'var(--seat-right, 8%)', transform: 'translate(0, -50%)' },
        { top: '75%', right: 'var(--seat-right, 8%)', transform: 'translate(0, -50%)' }
      ],
      // 6 players: 5 other players (3 Left, 2 Right)
      [
        { top: '15%', left: 'var(--seat-left, 8%)', transform: 'translate(0, -50%)' },
        { top: '50%', left: 'var(--seat-left, 8%)', transform: 'translate(0, -50%)' },
        { top: '85%', left: 'var(--seat-left, 8%)', transform: 'translate(0, -50%)' },
        { top: '25%', right: 'var(--seat-right, 8%)', transform: 'translate(0, -50%)' },
        { top: '75%', right: 'var(--seat-right, 8%)', transform: 'translate(0, -50%)' }
      ],
      // 7 players: 6 other players (3 Left, 3 Right)
      [
        { top: '15%', left: 'var(--seat-left, 8%)', transform: 'translate(0, -50%)' },
        { top: '50%', left: 'var(--seat-left, 8%)', transform: 'translate(0, -50%)' },
        { top: '85%', left: 'var(--seat-left, 8%)', transform: 'translate(0, -50%)' },
        { top: '15%', right: 'var(--seat-right, 8%)', transform: 'translate(0, -50%)' },
        { top: '50%', right: 'var(--seat-right, 8%)', transform: 'translate(0, -50%)' },
        { top: '85%', right: 'var(--seat-right, 8%)', transform: 'translate(0, -50%)' }
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

  const renderAvatar = (avatarUrl, name = '', size = 40) => {
    if (isAvatarSVG(avatarUrl)) {
      return <AvatarSVG avatarId={avatarUrl} size={size} />;
    }
    if (avatarUrl) {
      return <img src={avatarUrl} alt={name} referrerPolicy="no-referrer" />;
    }
    return null;
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10 }}>
          <button 
            className="control-btn"
            onClick={() => setShowScoreboard(!showScoreboard)}
            title="Scoreboard"
          >
            <BarChart3 size={22} />
          </button>

          {gameState.gameStarted && gameState.cursedNumber && (
            <div className="cursed-indicator-badge animate-pulse" title="Cursed card rank for this round! Play to skip, hold to lose!">
              <Skull size={14} className="cursed-badge-icon-svg" />
              <span className="cursed-badge-text">CURSED: <strong className="cursed-glowing-number">{gameState.cursedNumber}</strong></span>
            </div>
          )}
        </div>

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10 }}>
          <button 
            className="control-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings size={22} />
          </button>
        </div>
      </div>

      {/* Casino Table Area with Players Around It */}
      <div className="casino-area">
        {/* Opponent seats positioned around the table */}
        {otherPlayers.map((player, index) => {
          const freshReaction = getFreshReaction(player.id);
          return (
            <div 
              key={player.id} 
              className={`seat seat-${index} seat-of-${otherPlayers.length} ${gameState.currentTurn === player.id ? 'active-turn' : ''} ${gameState.eliminatedPlayers.includes(player.id) ? 'eliminated' : ''}`}
              style={getPlayerPosition(index, otherPlayers.length)}
            >
              <div className="seat-avatar" style={{ position: 'relative' }}>
                {player.avatarUrl ? (
                  renderAvatar(player.avatarUrl, player.name)
                ) : (
                  <span className="seat-letter">{player.name?.charAt(0).toUpperCase()}</span>
                )}
                {player.isHost && <span className="crown-badge"><Crown size={12} /></span>}
                {gameState.eliminatedPlayers.includes(player.id) && <span className="eliminated-badge">✕</span>}
                {freshReaction && (
                  <div className="emoji-reaction-bubble">
                    {freshReaction}
                  </div>
                )}
              </div>
              <div className="seat-info">
                <span className="seat-name">{player.name}</span>
                <span className="seat-score">{gameState.scores?.[player.id] || 0} pts</span>
                <span className="seat-cards">{gameState.playerHands[player.id]?.length || 0} cards</span>
              </div>
            </div>
          );
        })}

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
                  <div className="playing-card svg-card">
                    <img src={getCardImage(card)} alt={`${card.value} of ${card.suit}`} className="card-svg-img" draggable="false" />
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
            <div className="my-avatar" style={{ position: 'relative' }}>
              {orderedPlayers[0].avatarUrl ? (
                renderAvatar(orderedPlayers[0].avatarUrl, orderedPlayers[0].name, 45)
              ) : (
                <span className="my-avatar-letter">{orderedPlayers[0].name?.charAt(0).toUpperCase()}</span>
              )}
              {orderedPlayers[0].isHost && <span className="crown-badge"><Crown size={14} /></span>}
              {getFreshReaction(orderedPlayers[0].id) && (
                <div className="emoji-reaction-bubble">
                  {getFreshReaction(orderedPlayers[0].id)}
                </div>
              )}
            </div>
            <div className="my-details">
              <span className="my-name">{orderedPlayers[0].name}</span>
              <span className="my-stats">{myCards?.length || 0} cards · {calculateHandPoints(myCards)} pts · Score: {gameState.scores?.[orderedPlayers[0]?.id] || 0}</span>
            </div>
            
            {/* Reaction button */}
            <div className="my-reaction-trigger-container">
              <button 
                className="reaction-trigger-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Send Emoji Reaction"
              >
                <MessageSquare size={16} />
              </button>
              {showEmojiPicker && (
                <div className="quick-emoji-picker">
                  {REACTION_EMOJIS.map(emoji => (
                    <button 
                      key={emoji} 
                      className="quick-emoji-btn" 
                      onClick={() => handleSendEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="my-cards-fan">
            {myCards?.map((card, i) => {
              const isCardCursed = card.value === gameState.cursedNumber;
              return (
                <div 
                  key={card.id} 
                  className={`hand-card ${selectedCard?.id === card.id ? 'selected' : ''} ${draggingCard?.id === card.id ? 'dragging' : ''} ${!isMyTurn() ? 'not-my-turn' : ''} ${isCardCursed ? 'cursed-card' : ''}`}
                  style={{ '--i': i, '--total': myCards.length, position: 'relative' }}
                  draggable={isMyTurn()}
                  onDragStart={(e) => handleDragStart(e, card)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleCardClick(card)}
                  title={isCardCursed ? "Cursed card! Play to drop & skip without draw penalty!" : undefined}
                >
                  <div className="playing-card svg-card">
                    <img src={getCardImage(card)} alt={`${card.value} of ${card.suit}`} className="card-svg-img" draggable="false" />
                  </div>
                  {isCardCursed && (
                    <div className="cursed-card-indicator">
                      <Skull size={18} className="cursed-hand-card-skull-svg" />
                    </div>
                  )}
                </div>
              );
            }) || (
              [...Array(7)].map((_, i) => (
                <div key={i} className="hand-card" style={{ '--i': i, '--total': 7 }}>
                  <div className="card-back"><img src={getCardBack()} alt="Card Back" className="card-svg-img" /></div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Shuffle Overlay */}
      {gameState.isShuffling && (
        <div className="overlay-screen">
          <div className="overlay-content brutalist-loader-content">
            <div className="brutalist-loader-cards">
              <div className="loader-card loader-card-pink">
                <div className="loader-card-pattern">♠</div>
              </div>
              <div className="loader-card loader-card-yellow">
                <div className="loader-card-pattern">♥</div>
              </div>
              <div className="loader-card loader-card-cyan">
                <div className="loader-card-pattern">♦</div>
              </div>
            </div>
            <h2 className="overlay-title">Shuffling Deck...</h2>
          </div>
        </div>
      )}

      {/* Dealing Overlay removed */}

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
                try {
                  localStorage.removeItem(`room_details_cache_${roomId}`)
                  localStorage.removeItem(`game_state_cache_${roomId}`)
                  await gameAPI.leaveRoom(roomId)
                } catch(e) {}
                navigate('/')
              }}>
                <DoorOpen size={16} /> Leave Game
              </button>
              <button className="settings-item" onClick={async () => {
                setShowSettings(false)
                localStorage.removeItem(`room_details_cache_${roomId}`)
                localStorage.removeItem(`game_state_cache_${roomId}`)
                if (isHost()) {
                  try { await gameAPI.endGame(roomId) } catch(e) {}
                }
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
                <div key={p.id} className={`round-score-item ${p.id === gameState.roundResult.winner?.id ? 'round-winner-row' : ''} ${p.hasCursedCard ? 'round-cursed-row' : ''}`}>
                  <span className="round-score-name">
                    {p.name}
                    {p.id === gameState.roundResult.winner?.id && <> <Trophy size={14} /></>}
                    {p.hasCursedCard && <span className="cursed-row-badge" title="Held the Cursed Card at round end!"><Skull size={12} className="inline-skull-svg" /> CURSED</span>}
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
          {showGameWin.winnerName === currentUser?.name && (
            <div ref={fireworksRef} className="fireworks-container"></div>
          )}
          <div className="overlay-content game-win-content" style={{ zIndex: 10 }}>
            <div className="win-trophy"><Trophy size={48} /></div>
            <h2 className="overlay-title game-win-title">
              {showGameWin.winnerName === currentUser?.name ? 'You Win!' : `${showGameWin.winnerName} Wins!`}
            </h2>
            <p className="win-subtitle">Game Over</p>
            <div className="multiplayer-coin-reward">
              <span className="reward-icon-glow"><Coins size={18} className="spinning-coin" /></span>
              <span className="reward-value">
                +{showGameWin.winnerName === currentUser?.name ? 70 : 20} Coins
              </span>
            </div>
            <button className="win-btn" onClick={async () => {
              setShowGameWin(false)
              localStorage.removeItem(`room_details_cache_${roomId}`)
              localStorage.removeItem(`game_state_cache_${roomId}`)
              try { await gameAPI.endGame(roomId) } catch(e) {}
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
            <div className="multiplayer-coin-reward loss-reward">
              <span className="reward-icon-glow"><Coins size={18} className="spinning-coin" /></span>
              <span className="reward-value">+20 Coins</span>
            </div>
            <div className="loss-actions">
              <button className="loss-btn" onClick={() => setShowGameLoss(false)}>
                Watch Game
              </button>
              <button className="loss-btn loss-btn-leave" onClick={async () => {
                setShowGameLoss(false)
                localStorage.removeItem(`room_details_cache_${roomId}`)
                localStorage.removeItem(`game_state_cache_${roomId}`)
                try { await gameAPI.leaveRoom(roomId) } catch(e) {}
                navigate('/rooms')
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
            <button className="win-btn" onClick={async () => {
              setShowGameEndSummary(false)
              localStorage.removeItem(`room_details_cache_${roomId}`)
              localStorage.removeItem(`game_state_cache_${roomId}`)
              try { await gameAPI.endGame(roomId) } catch(e) {}
              navigate(`/room/${roomId}`)
            }}>
              Back to Lobby
            </button>
          </div>
        </div>
      )}

      {/* Cursed Card Round Announcement Overlay */}
      {showCursedPop && gameState.cursedNumber && (
        <div className="overlay-screen cursed-announcement-overlay">
          <div className="overlay-content cursed-announcement-content">
            <div className="cursed-danger-badge animate-pulse">
              <AlertTriangle size={18} /> TWIST ACTIVE <AlertTriangle size={18} />
            </div>
            <h2 className="overlay-title cursed-title-neon">CURSED CARD ACTIVE!</h2>
            <div className="cursed-glowing-card-container">
              <div className="cursed-glowing-card-felt">
                <div className="playing-card svg-card cursed-popup-card">
                  <img 
                    src={`/cards/${gameState.cursedNumber === 'A' ? 'ace' : gameState.cursedNumber === 'J' ? 'jack' : gameState.cursedNumber === 'Q' ? 'queen' : gameState.cursedNumber === 'K' ? 'king' : gameState.cursedNumber}_of_spades.svg`} 
                    alt={`Cursed card ${gameState.cursedNumber}`} 
                    className="card-svg-img" 
                    draggable="false" 
                  />
                  <div className="cursed-popup-skull">
                    <Skull size={44} className="cursed-popup-skull-svg" />
                  </div>
                </div>
              </div>
            </div>
            <div className="cursed-desc">
              Rank <strong className="cursed-highlight">{gameState.cursedNumber}</strong> is cursed this round!
            </div>
            <div className="cursed-instructions">
              <div className="cursed-inst-row">
                <Zap size={16} className="pop-icon-yellow" /> Play it singly for a <strong>DIRECT DROP & skip turn</strong> (No draw penalty!)
              </div>
              <div className="cursed-inst-row font-red animate-pulse">
                <Skull size={16} className="pop-icon-pink" /> Holding it at the round end triggers <strong>INSTANT LOSS (+Max Points)</strong>!
              </div>
            </div>
            <button className="cursed-close-btn" onClick={() => setShowCursedPop(false)}>
              <X size={16} /> GOT IT!
            </button>
          </div>
        </div>
      )}

      {/* Synced Cursed Card Drop alert toast */}
      {cursedPlayToast && (
        <div className="cursed-play-toast">
          <div className="cursed-toast-content">
            <span className="cursed-toast-icon"><Flame size={20} className="pop-icon-pink" /></span>
            <span className="cursed-toast-text">
              <strong>{cursedPlayToast.playerName}</strong> dropped Cursed Card <strong>{cursedPlayToast.cardValue}</strong>! Skip turn with <strong>NO penalty</strong>!
            </span>
            <span className="cursed-toast-icon"><Flame size={20} className="pop-icon-pink" /></span>
          </div>
        </div>
      )}
    </div>
  )
}

export default Game
