import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getCardImage, getCardBack } from '../utils/cardImages'
import { 
  Gamepad2, Target, Package, Zap, Lightbulb, Layers, BarChart3, Skull, 
  SkipForward, Moon, Flame, Brain, Trophy, ShieldHalf, Swords, User, 
  Rocket, Home, Frown, RefreshCw, X, VolumeX, BookOpen, ArrowLeft,
  CircleDot, Play, Coins
} from 'lucide-react'
import { authAPI, userAPI } from '../services/api'
import './Game.css'
import './PracticeGame.css'

// Card suits and values
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades']
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }

const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const getCardValue = (cardValue) => {
  if (cardValue === 'A') return 1
  if (cardValue === 'J') return 11
  if (cardValue === 'Q') return 12
  if (cardValue === 'K') return 13
  return parseInt(cardValue)
}

const calculateHandPoints = (cards) => {
  if (!cards || cards.length === 0) return 0
  return cards.reduce((total, card) => total + getCardValue(card.value), 0)
}

// Bot personalities
const BOT_PLAYERS = [
  { id: 'bot-1', name: 'Luna', style: 'cautious', icon: 'moon', color: '#a78bfa' },
  { id: 'bot-2', name: 'Blaze', style: 'aggressive', icon: 'flame', color: '#f97316' },
  { id: 'bot-3', name: 'Sage', style: 'smart', icon: 'brain', color: '#34d399' },
]

const BotIcon = ({ icon, size = 18 }) => {
  if (icon === 'moon') return <Moon size={size} />
  if (icon === 'flame') return <Flame size={size} />
  if (icon === 'brain') return <Brain size={size} />
  return <User size={size} />
}

// Tutorial tips that appear contextually
const TIPS = {
  welcome: {
    title: 'Welcome to Practice Mode!',
    icon: 'gamepad',
    text: 'Play against 3 AI opponents to learn LowXena. Goal: Keep your score under 40 points. The lowest hand wins each round!',
  },
  yourTurn: {
    title: 'Your Turn!',
    icon: 'target',
    text: 'Play a card by clicking it, then click the play area. If you have two cards of the same value, they\'ll both be played automatically!',
  },
  mustPickup: {
    title: 'Pick Up a Card',
    icon: 'package',
    text: 'After playing a card, you MUST pick up one from the deck. Click the deck to draw.',
  },
  lowxena: {
    title: 'LowXena Available!',
    icon: 'zap',
    text: 'Your hand is 10 points or less! Press "LowXena!" to end the round. The player with the lowest hand wins and resets to 0 score!',
  },
  highCards: {
    title: 'Strategy Tip',
    icon: 'lightbulb',
    text: 'Try to get rid of high-value cards (J=11, Q=12, K=13) first. Keep low cards (A=1, 2, 3) for when you call LowXena!',
  },
  doublePlay: {
    title: 'Double Play!',
    icon: 'layers',
    text: 'If you have two cards with the same value (e.g. two 7s), playing one automatically plays both — a great way to dump points!',
  },
  roundEnd: {
    title: 'Round Complete',
    icon: 'barchart',
    text: 'The lowest hand gets 0 points. Everyone else adds their hand points to their score. First to reach 40 is eliminated!',
  },
  elimination: {
    title: 'Elimination',
    icon: 'skull',
    text: 'A player who reaches 40+ cumulative points is knocked out. Last player standing wins the game!',
  },
  moveSkip: {
    title: 'Skip Turn (Move)',
    icon: 'skip',
    text: 'You can skip your turn by pressing "Move" — useful when you have a good low hand and don\'t want to risk drawing a high card.',
  },
}

const TipIcon = ({ icon, size = 18 }) => {
  const props = { size, strokeWidth: 2 }
  switch (icon) {
    case 'gamepad': return <Gamepad2 {...props} />
    case 'target': return <Target {...props} />
    case 'package': return <Package {...props} />
    case 'zap': return <Zap {...props} />
    case 'lightbulb': return <Lightbulb {...props} />
    case 'layers': return <Layers {...props} />
    case 'barchart': return <BarChart3 {...props} />
    case 'skull': return <Skull {...props} />
    case 'skip': return <SkipForward {...props} />
    default: return null
  }
}

function PracticeGame() {
  const navigate = useNavigate()
  const [gamePhase, setGamePhase] = useState('setup') // setup | playing | roundResult | gameOver
  const [difficulty, setDifficulty] = useState('easy') // easy | medium | hard
  const [numBots, setNumBots] = useState(3)
  
  // All players (you + bots)
  const [players, setPlayers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [updatedCoins, setUpdatedCoins] = useState(null)
  const [isSavingStats, setIsSavingStats] = useState(false)
  const [saveError, setSaveError] = useState(null)
  
  // Game state
  const [deck, setDeck] = useState([])
  const [playerHands, setPlayerHands] = useState({})
  const [playedCards, setPlayedCards] = useState([])
  const [currentTurn, setCurrentTurn] = useState(null)
  const [scores, setScores] = useState({})
  const [roundNumber, setRoundNumber] = useState(1)
  const [eliminatedPlayers, setEliminatedPlayers] = useState([])
  const [mustPickup, setMustPickup] = useState(false)
  const [hasPlayedCard, setHasPlayedCard] = useState(false)
  const [countdown, setCountdown] = useState(45) // More time for learning
  
  // UI state
  const [selectedCard, setSelectedCard] = useState(null)
  const [draggingCard, setDraggingCard] = useState(null)
  const [dropHover, setDropHover] = useState(false)
  const [isShuffling, setIsShuffling] = useState(false)
  const [isDealing, setIsDealing] = useState(false)
  const [showScoreboard, setShowScoreboard] = useState(false)
  
  // Round/Game results
  const [roundResult, setRoundResult] = useState(null)
  const [gameWinner, setGameWinner] = useState(null)
  
  // Tutorial
  const [currentTip, setCurrentTip] = useState(null)
  const [tipHistory, setTipHistory] = useState([])
  const [showTips, setShowTips] = useState(true)
  const [botThinking, setBotThinking] = useState(null) // bot id that is "thinking"
  const [botAction, setBotAction] = useState(null) // { botName, action } for showing what bot did
  
  const botTimerRef = useRef(null)
  const tipTimerRef = useRef(null)

  // Show a tip if not shown before (or force it)
  const showTip = useCallback((tipKey, force = false) => {
    if (!showTips) return
    if (!force && tipHistory.includes(tipKey)) return
    setCurrentTip(TIPS[tipKey])
    setTipHistory(prev => [...prev, tipKey])
    
    // Auto-dismiss after 6 seconds
    if (tipTimerRef.current) clearTimeout(tipTimerRef.current)
    tipTimerRef.current = setTimeout(() => setCurrentTip(null), 6000)
  }, [showTips, tipHistory])

  // Initialize user
  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'))
      if (userData) {
        setCurrentUser({ id: userData.id || 'player-1', name: userData.name || 'You' })
      } else {
        setCurrentUser({ id: 'player-1', name: 'You' })
      }
    } catch {
      setCurrentUser({ id: 'player-1', name: 'You' })
    }
  }, [])

  // Start the game
  const startGame = () => {
    const user = currentUser || { id: 'player-1', name: 'You' }
    const bots = BOT_PLAYERS.slice(0, numBots)
    const allPlayers = [user, ...bots]
    setPlayers(allPlayers)
    
    // Initialize scores
    const initScores = {}
    allPlayers.forEach(p => { initScores[p.id] = 0 })
    setScores(initScores)
    setEliminatedPlayers([])
    setRoundNumber(1)
    setGameWinner(null)
    setRoundResult(null)
    
    // Create and shuffle deck
    setIsShuffling(true)
    setGamePhase('playing')
    showTip('welcome', true)
    
    setTimeout(() => {
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
      const shuffled = shuffleArray(fullDeck)
      
      setIsShuffling(false)
      setIsDealing(true)
      
      setTimeout(() => {
        // Deal 7 cards each
        const hands = {}
        allPlayers.forEach((player, index) => {
          hands[player.id] = shuffled.slice(index * 7, (index + 1) * 7)
        })
        const remaining = shuffled.slice(allPlayers.length * 7)
        
        setDeck(remaining)
        setPlayerHands(hands)
        setPlayedCards([])
        setCurrentTurn(user.id) // Player goes first
        setMustPickup(false)
        setHasPlayedCard(false)
        setIsDealing(false)
        setCountdown(45)
      }, 1200)
    }, 1500)
  }

  // Start a new round (after round result)
  const startNewRound = (updatedScores, updatedEliminated, newRoundNum) => {
    const remaining = players.filter(p => !updatedEliminated.includes(p.id))
    if (remaining.length <= 1) {
      setGameWinner(remaining[0] || null)
      setGamePhase('gameOver')
      return
    }
    
    setIsShuffling(true)
    setRoundResult(null)
    setGamePhase('playing')
    
    setTimeout(() => {
      const fullDeck = []
      SUITS.forEach(suit => {
        VALUES.forEach(value => {
          fullDeck.push({
            suit, value,
            id: `${value}-${suit}-r${newRoundNum}`,
            color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black'
          })
        })
      })
      const shuffled = shuffleArray(fullDeck)
      
      setIsShuffling(false)
      setIsDealing(true)
      
      setTimeout(() => {
        const hands = {}
        remaining.forEach((player, index) => {
          hands[player.id] = shuffled.slice(index * 7, (index + 1) * 7)
        })
        updatedEliminated.forEach(id => { hands[id] = [] })
        
        const remainingDeck = shuffled.slice(remaining.length * 7)
        
        setDeck(remainingDeck)
        setPlayerHands(hands)
        setPlayedCards([])
        setCurrentTurn(remaining[0].id)
        setMustPickup(false)
        setHasPlayedCard(false)
        setIsDealing(false)
        setRoundNumber(newRoundNum)
        setCountdown(45)
        setSelectedCard(null)
      }, 1200)
    }, 1500)
  }

  // Countdown timer
  useEffect(() => {
    if (gamePhase !== 'playing' || !currentTurn) return
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Auto-advance on timeout
          if (isPlayerTurn() && mustPickup) {
            doPickupCard()
          } else if (isPlayerTurn()) {
            advanceTurn()
          }
          return 45
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [gamePhase, currentTurn, mustPickup])

  // Bot turn logic
  useEffect(() => {
    if (gamePhase !== 'playing') return
    if (!currentTurn || !currentTurn.startsWith('bot-')) return
    if (isShuffling || isDealing) return
    
    // Clear any previous timer
    if (botTimerRef.current) clearTimeout(botTimerRef.current)
    
    const bot = players.find(p => p.id === currentTurn)
    if (!bot || eliminatedPlayers.includes(bot.id)) {
      advanceTurn()
      return
    }
    
    setBotThinking(bot.id)
    
    // Bot "thinks" for 1-3 seconds based on difficulty
    const thinkTime = difficulty === 'easy' ? 1500 : difficulty === 'medium' ? 1200 : 800
    
    botTimerRef.current = setTimeout(() => {
      executeBotTurn(bot)
    }, thinkTime)
    
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current)
    }
  }, [currentTurn, gamePhase, isShuffling, isDealing])

  const isPlayerTurn = () => {
    return currentUser && currentTurn === currentUser.id
  }

  const getActivePlayers = () => {
    return players.filter(p => !eliminatedPlayers.includes(p.id))
  }

  const advanceTurn = useCallback(() => {
    const active = players.filter(p => !eliminatedPlayers.includes(p.id))
    if (active.length === 0) return
    
    const currentIndex = active.findIndex(p => p.id === currentTurn)
    const nextIndex = (currentIndex + 1) % active.length
    const nextPlayer = active[nextIndex]
    
    setCurrentTurn(nextPlayer.id)
    setMustPickup(false)
    setHasPlayedCard(false)
    setCountdown(45)
    setSelectedCard(null)
    setBotThinking(null)
    setBotAction(null)
    
    // Show tips for player turn
    if (nextPlayer.id === currentUser?.id) {
      const myHand = playerHands[currentUser.id] || []
      const pts = calculateHandPoints(myHand)
      if (pts <= 10) {
        showTip('lowxena')
      } else if (myHand.some(c => getCardValue(c.value) >= 11)) {
        showTip('highCards')
      } else {
        showTip('yourTurn')
      }
    }
  }, [players, eliminatedPlayers, currentTurn, currentUser, playerHands, showTip])

  // Bot AI logic
  const executeBotTurn = (bot) => {
    const hand = playerHands[bot.id] || []
    if (hand.length === 0) {
      advanceTurn()
      return
    }
    
    const pts = calculateHandPoints(hand)
    const style = bot.style
    
    // Check if bot should call LowXena
    let shouldCallLowXena = false
    if (pts <= 10) {
      if (style === 'aggressive') shouldCallLowXena = pts <= 8 || Math.random() > 0.3
      else if (style === 'cautious') shouldCallLowXena = pts <= 5 || Math.random() > 0.7
      else shouldCallLowXena = pts <= 7 || Math.random() > 0.5 // smart
      
      // Hard mode: smarter decisions
      if (difficulty === 'hard' && style === 'smart') {
        shouldCallLowXena = pts <= 6
      }
      // Easy mode: bots make more mistakes
      if (difficulty === 'easy') {
        shouldCallLowXena = shouldCallLowXena && Math.random() > 0.4
      }
    }
    
    if (shouldCallLowXena) {
      setBotAction({ botName: bot.name, action: 'calls LowXena!' })
      setBotThinking(null)
      setTimeout(() => doBotLowXena(bot), 500)
      return
    }
    
    // Decide: play a card or skip (move)
    let shouldSkip = false
    if (pts <= 15 && style === 'cautious') shouldSkip = Math.random() > 0.6
    if (pts <= 12 && style === 'smart') shouldSkip = Math.random() > 0.7
    if (difficulty === 'easy') shouldSkip = shouldSkip && Math.random() > 0.5
    
    if (shouldSkip) {
      setBotAction({ botName: bot.name, action: 'skips turn' })
      setBotThinking(null)
      setTimeout(() => advanceTurn(), 600)
      return
    }
    
    // Pick a card to play
    let cardToPlay
    if (style === 'aggressive') {
      // Play highest card to dump points
      cardToPlay = [...hand].sort((a, b) => getCardValue(b.value) - getCardValue(a.value))[0]
    } else if (style === 'cautious') {
      // Play medium cards, keep low ones
      const sorted = [...hand].sort((a, b) => getCardValue(a.value) - getCardValue(b.value))
      cardToPlay = sorted[Math.floor(sorted.length / 2)]
    } else {
      // Smart: play highest, but keep pairs together
      const valueCounts = {}
      hand.forEach(c => { valueCounts[c.value] = (valueCounts[c.value] || 0) + 1 })
      const pairs = hand.filter(c => valueCounts[c.value] >= 2)
      
      if (pairs.length > 0) {
        // Play highest pair (dumps more points)
        cardToPlay = [...pairs].sort((a, b) => getCardValue(b.value) - getCardValue(a.value))[0]
      } else {
        cardToPlay = [...hand].sort((a, b) => getCardValue(b.value) - getCardValue(a.value))[0]
      }
    }
    
    setBotAction({ botName: bot.name, action: `plays ${cardToPlay.value}${SUIT_SYMBOLS[cardToPlay.suit]}` })
    setBotThinking(null)
    
    // Execute the play
    setTimeout(() => {
      doBotPlayCard(bot, cardToPlay)
    }, 500)
  }

  const doBotPlayCard = (bot, card) => {
    const hand = [...(playerHands[bot.id] || [])]
    const cardIndex = hand.findIndex(c => c.id === card.id)
    if (cardIndex === -1) { advanceTurn(); return }
    
    const cardsToPlay = [card]
    hand.splice(cardIndex, 1)
    
    // Check for double play (same value)
    const matchingIndex = hand.findIndex(c => c.value === card.value)
    if (matchingIndex !== -1) {
      cardsToPlay.push(hand[matchingIndex])
      hand.splice(matchingIndex, 1)
      setBotAction(prev => prev ? { ...prev, action: `plays double ${card.value}${SUIT_SYMBOLS[card.suit]}!` } : prev)
    }
    
    setPlayerHands(prev => ({ ...prev, [bot.id]: hand }))
    setPlayedCards(prev => [...prev, ...cardsToPlay])
    
    // Bot picks up after playing
    setTimeout(() => {
      doBotPickup(bot)
    }, 700)
  }

  const doBotPickup = (bot) => {
    if (deck.length === 0) {
      advanceTurn()
      return
    }
    
    const newDeck = [...deck]
    const randomIndex = Math.floor(Math.random() * newDeck.length)
    const pickedCard = newDeck.splice(randomIndex, 1)[0]
    const newHand = [...(playerHands[bot.id] || []), pickedCard]
    
    setDeck(newDeck)
    setPlayerHands(prev => ({ ...prev, [bot.id]: newHand }))
    
    setTimeout(() => advanceTurn(), 400)
  }

  const doBotLowXena = (bot) => {
    executeRoundEnd(bot)
  }

  // Player actions
  const handlePlayCard = (card) => {
    if (!isPlayerTurn() || hasPlayedCard || !card) return
    
    const myId = currentUser.id
    const myHand = [...(playerHands[myId] || [])]
    const cardIndex = myHand.findIndex(c => c.id === card.id)
    if (cardIndex === -1) return
    
    const cardsToPlay = [card]
    myHand.splice(cardIndex, 1)
    
    // Check for double play
    const matchingIndex = myHand.findIndex(c => c.value === card.value)
    if (matchingIndex !== -1) {
      cardsToPlay.push(myHand[matchingIndex])
      myHand.splice(matchingIndex, 1)
      showTip('doublePlay')
    }
    
    if (cardsToPlay.length > 1) {
      setPlayerHands(prev => ({ ...prev, [myId]: myHand }))
      setPlayedCards(prev => [...prev, ...cardsToPlay])
      setSelectedCard(null)
      setTimeout(() => advanceTurn(), 300)
    } else {
      setPlayerHands(prev => ({ ...prev, [myId]: myHand }))
      setPlayedCards(prev => [...prev, ...cardsToPlay])
      setMustPickup(true)
      setHasPlayedCard(true)
      setSelectedCard(null)
      
      showTip('mustPickup')
    }
  }

  const doPickupCard = () => {
    if (!isPlayerTurn() || !currentUser) return
    
    if (deck.length === 0) {
      advanceTurn()
      return
    }
    
    const myId = currentUser.id
    const newDeck = [...deck]
    const randomIndex = Math.floor(Math.random() * newDeck.length)
    const pickedCard = newDeck.splice(randomIndex, 1)[0]
    const newHand = [...(playerHands[myId] || []), pickedCard]
    
    setDeck(newDeck)
    setPlayerHands(prev => ({ ...prev, [myId]: newHand }))
    
    // After pickup, advance turn
    setTimeout(() => advanceTurn(), 300)
  }

  const handleMove = () => {
    if (!isPlayerTurn() || hasPlayedCard) return
    showTip('moveSkip')
    advanceTurn()
  }

  const handleLowXena = () => {
    if (!isPlayerTurn() || !currentUser) return
    const myHand = playerHands[currentUser.id] || []
    if (calculateHandPoints(myHand) > 10) return
    executeRoundEnd(currentUser)
  }

  // End round - calculate scores, check eliminations
  const executeRoundEnd = (calledBy) => {
    const active = getActivePlayers()
    const playerScoresThisRound = active.map(p => ({
      id: p.id,
      name: p.name,
      handPoints: calculateHandPoints(playerHands[p.id] || []),
      hand: playerHands[p.id] || []
    }))
    
    const minPoints = Math.min(...playerScoresThisRound.map(p => p.handPoints))
    const roundWinner = playerScoresThisRound.find(p => p.handPoints === minPoints)
    
    // Update cumulative scores
    const newScores = { ...scores }
    playerScoresThisRound.forEach(p => {
      if (!newScores[p.id]) newScores[p.id] = 0
      newScores[p.id] += p.handPoints
    })
    // Winner resets to 0
    if (roundWinner) newScores[roundWinner.id] = 0
    
    // Check eliminations
    const maxPoints = 40
    const newEliminated = [...eliminatedPlayers]
    const newlyEliminated = []
    active.forEach(p => {
      if (newScores[p.id] >= maxPoints && !newEliminated.includes(p.id)) {
        newEliminated.push(p.id)
        newlyEliminated.push(p)
      }
    })
    
    const remaining = players.filter(p => !newEliminated.includes(p.id))
    let isGameOver = remaining.length <= 1
    let winner = isGameOver ? (remaining[0] || null) : null
    
    setScores(newScores)
    setEliminatedPlayers(newEliminated)
    setRoundResult({
      winner: roundWinner,
      playerScores: playerScoresThisRound,
      newCumulativeScores: newScores,
      newlyEliminated,
      roundNumber,
      calledBy: { id: calledBy.id, name: calledBy.name },
    })
    setGamePhase('roundResult')
    
    showTip('roundEnd', true)
    if (newlyEliminated.length > 0) {
      setTimeout(() => showTip('elimination', true), 3000)
    }
    
    // Auto-advance after showing result
    setTimeout(async () => {
      if (isGameOver) {
        setGameWinner(winner)
        setGamePhase('gameOver')
        
        // Save stats and award coins!
        const userWon = winner?.id === currentUser?.id;
        const userScore = newScores[currentUser?.id] || 0;
        
        if (authAPI.isAuthenticated()) {
          setIsSavingStats(true);
          try {
            const res = await userAPI.updateStats({
              won: userWon,
              score: userScore,
              duration: 0
            });
            if (res.success) {
              const earned = 10 + (userWon ? 20 : 0);
              setCoinsEarned(earned);
              if (res.coins !== undefined) {
                setUpdatedCoins(res.coins);
              } else if (res.user?.coins !== undefined) {
                setUpdatedCoins(res.user.coins);
              }
              
              // Update local storage too so Home has it
              const cachedUser = authAPI.getCurrentUser();
              if (cachedUser) {
                cachedUser.coins = (cachedUser.coins || 0) + earned;
                localStorage.setItem('userData', JSON.stringify(cachedUser));
              }
            }
          } catch (err) {
            console.error('Failed to save practice stats:', err);
            setSaveError('Failed to save coins to database.');
          } finally {
            setIsSavingStats(false);
          }
        }
      } else {
        startNewRound(newScores, newEliminated, roundNumber + 1)
      }
    }, 4500)
  }

  // Card interaction
  const handleCardClick = (card) => {
    if (!isPlayerTurn()) return
    if (selectedCard?.id === card.id) {
      setSelectedCard(null)
    } else {
      setSelectedCard(card)
    }
  }

  const handleDragStart = (e, card) => {
    if (!isPlayerTurn()) return
    setDraggingCard(card)
    setSelectedCard(null)
    e.dataTransfer.setData('text/plain', card.id)
  }

  const handleDragEnd = () => {
    setDraggingCard(null)
    setDropHover(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDropHover(false)
    if (draggingCard) handlePlayCard(draggingCard)
  }

  const handlePlayedAreaClick = () => {
    if (selectedCard && isPlayerTurn()) handlePlayCard(selectedCard)
  }

  const handlePickupClick = () => {
    if (mustPickup && isPlayerTurn()) doPickupCard()
  }

  // Restart game
  const handleRestart = () => {
    setGamePhase('setup')
    setPlayers([])
    setDeck([])
    setPlayerHands({})
    setPlayedCards([])
    setCurrentTurn(null)
    setScores({})
    setRoundNumber(1)
    setEliminatedPlayers([])
    setRoundResult(null)
    setGameWinner(null)
    setTipHistory([])
    setCurrentTip(null)
    setBotThinking(null)
    setBotAction(null)
    setCoinsEarned(0)
    setUpdatedCoins(null)
    setIsSavingStats(false)
    setSaveError(null)
  }

  // Get bot display info
  const getBotInfo = (playerId) => {
    return BOT_PLAYERS.find(b => b.id === playerId)
  }

  const myCards = currentUser ? (playerHands[currentUser.id] || []) : []
  const myPoints = calculateHandPoints(myCards)
  const otherPlayers = players.filter(p => p.id !== currentUser?.id)

  // =================== RENDER ===================

  // Setup screen
  if (gamePhase === 'setup') {
    return (
      <div className="game-container">
        <div className="game-background">
          <div className="stars"></div>
          <div className="game-gradient"></div>
        </div>
        
        <div className="practice-setup">
          <Link className="practice-back-btn" to="/">
            ← Back
          </Link>
          
          <div className="practice-setup-card">
            <div className="setup-icon"><Gamepad2 size={48} /></div>
            <h1>Practice Mode</h1>
            <p className="setup-subtitle">Train against AI opponents and master LowXena</p>
            
            <div className="setup-section">
              <label>Difficulty</label>
              <div className="setup-options">
                <button 
                  className={`setup-option ${difficulty === 'easy' ? 'active' : ''}`}
                  onClick={() => setDifficulty('easy')}
                >
                  <span className="opt-emoji opt-green"><CircleDot size={20} /></span>
                  <span className="opt-label">Easy</span>
                  <span className="opt-desc">Bots make mistakes, perfect for learning</span>
                </button>
                <button 
                  className={`setup-option ${difficulty === 'medium' ? 'active' : ''}`}
                  onClick={() => setDifficulty('medium')}
                >
                  <span className="opt-emoji opt-yellow"><CircleDot size={20} /></span>
                  <span className="opt-label">Medium</span>
                  <span className="opt-desc">Balanced AI, good for practice</span>
                </button>
                <button 
                  className={`setup-option ${difficulty === 'hard' ? 'active' : ''}`}
                  onClick={() => setDifficulty('hard')}
                >
                  <span className="opt-emoji opt-red"><CircleDot size={20} /></span>
                  <span className="opt-label">Hard</span>
                  <span className="opt-desc">Smart bots that play to win</span>
                </button>
              </div>
            </div>
            
            <div className="setup-section">
              <label>Opponents</label>
              <div className="setup-bots-row">
                {[1, 2, 3].map(n => (
                  <button 
                    key={n} 
                    className={`bot-count-btn ${numBots === n ? 'active' : ''}`}
                    onClick={() => setNumBots(n)}
                  >
                    {n} Bot{n > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
              <div className="bot-preview">
                {BOT_PLAYERS.slice(0, numBots).map(bot => (
                  <div key={bot.id} className="bot-preview-card" style={{ borderColor: bot.color }}>
                    <span className="bot-icon-wrap" style={{ color: bot.color }}><BotIcon icon={bot.icon} size={26} /></span>
                    <span className="bot-name">{bot.name}</span>
                    <span className="bot-style" style={{ color: bot.color }}>
                      {bot.style === 'cautious' ? 'Cautious' : bot.style === 'aggressive' ? 'Aggressive' : 'Strategic'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="setup-rules-summary">
              <h3><BookOpen size={16} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px' }} />Quick Rules</h3>
              <ul>
                <li><strong>Goal:</strong> Keep your score under 40 points</li>
                <li><strong>Each turn:</strong> Play a card → Pick up from deck</li>
                <li><strong>LowXena:</strong> Call when hand ≤ 10 pts to end round</li>
                <li><strong>Round winner:</strong> Lowest hand = score resets to 0</li>
                <li><strong>Eliminated:</strong> Reach 40+ pts = knocked out</li>
                <li><strong>Win:</strong> Be the last player standing!</li>
              </ul>
            </div>
            
            <button className="practice-start-btn" onClick={startGame}>
              <Play size={18} style={{ display: 'inline', verticalAlign: '-3px', marginRight: '6px' }} /> Start Practice Game
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main game
  return (
    <div className="game-container">
      <div className="game-background">
        <div className="stars"></div>
        <div className="game-gradient"></div>
      </div>

      {/* Practice Mode Banner */}
      <div className="practice-banner">
        <span className="practice-badge"><Gamepad2 size={14} /> PRACTICE</span>
        <span className="practice-diff-badge">{difficulty.toUpperCase()}</span>
      </div>

      {/* Top Bar */}
      <div className="game-top-bar">
        <button className="control-btn" onClick={() => setShowScoreboard(!showScoreboard)} title="Scoreboard">
          <BarChart3 size={22} />
        </button>

        <div className="turn-indicator">
          <span className="round-badge">R{roundNumber}</span>
          <span className="turn-label">
            {isPlayerTurn() 
              ? (mustPickup ? <><Package size={14} /> Pick Up a Card!</> : <><Target size={14} /> Your Turn</>) 
              : currentTurn?.startsWith('bot-')
                ? <><span className="inline-bot-icon"><BotIcon icon={getBotInfo(currentTurn)?.icon} size={14} /></span> {getBotInfo(currentTurn)?.name} thinking...</>
                : 'Waiting...'}
          </span>
          <span className="turn-timer">{countdown}s</span>
        </div>

        <div className="practice-controls">
          <button 
            className="control-btn" 
            onClick={() => setShowTips(prev => !prev)} 
            title={showTips ? 'Hide Tips' : 'Show Tips'}
          >
            {showTips ? <Lightbulb size={18} /> : <VolumeX size={18} />}
          </button>
          <button className="control-btn" onClick={handleRestart} title="Restart">
            <RefreshCw size={18} />
          </button>
          <button className="control-btn" onClick={() => navigate('/')} title="Exit">
            ✕
          </button>
        </div>
      </div>

      {/* Tutorial Tip */}
      {currentTip && showTips && (
        <div className="tutorial-tip" onClick={() => setCurrentTip(null)}>
          <div className="tip-title"><TipIcon icon={currentTip.icon} size={16} /> {currentTip.title}</div>
          <div className="tip-text">{currentTip.text}</div>
          <span className="tip-dismiss">Tap to dismiss</span>
        </div>
      )}

      {/* Bot Action Toast */}
      {botAction && (
        <div className="bot-action-toast">
          {botAction.botName} {botAction.action}
        </div>
      )}

      {/* Opponents Row */}
      <div className="opponents-row">
        {otherPlayers.map((player) => {
          const bot = getBotInfo(player.id)
          const isThinking = botThinking === player.id
          const isEliminated = eliminatedPlayers.includes(player.id)
          const isActive = currentTurn === player.id
          
          return (
            <div key={player.id} className={`opponent-card ${isActive ? 'active-turn' : ''} ${isEliminated ? 'eliminated' : ''}`}>
              <div className="opponent-avatar" style={{ borderColor: bot?.color || '#666' }}>
                <span className="opponent-letter"><BotIcon icon={bot?.icon} size={18} /></span>
                {isEliminated && <span className="eliminated-badge">✕</span>}
                {isThinking && <div className="thinking-dots"><span>.</span><span>.</span><span>.</span></div>}
              </div>
              <div className="opponent-info">
                <span className="opponent-name">{player.name}</span>
                <span className="opponent-score">{scores[player.id] || 0} pts</span>
                <span className="opponent-cards">{playerHands[player.id]?.length || 0} cards</span>
                {bot && <span className="opponent-style" style={{color: bot.color}}>
                  {bot.style === 'cautious' ? <ShieldHalf size={14} /> : bot.style === 'aggressive' ? <Swords size={14} /> : <Brain size={14} />}
                </span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Game Table */}
      <div className="game-table">
        <div className="table-surface">
          <div className="table-felt"></div>
          
          {/* Deck */}
          <div 
            className={`deck-area ${mustPickup && isPlayerTurn() ? 'deck-pickup-ready' : ''}`}
            onClick={handlePickupClick}
          >
            <div className="deck-stack">
              {deck.length > 0 ? (
                [...Array(Math.min(4, deck.length))].map((_, i) => (
                  <div key={i} className="card-back deck-card" style={{ transform: `translateY(-${i * 2}px)` }}>
                    <div className="card-pattern"></div>
                  </div>
                ))
              ) : (
                <div className="empty-deck">Empty</div>
              )}
            </div>
            <span className="deck-label">
              {deck.length}
              {mustPickup && isPlayerTurn() && <span className="pickup-hint"> ← Pick up!</span>}
            </span>
          </div>

          {/* Played Cards */}
          <div 
            className={`played-area ${dropHover ? 'drop-hover' : ''} ${selectedCard && isPlayerTurn() ? 'can-drop' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDropHover(true) }}
            onDragLeave={() => setDropHover(false)}
            onDrop={handleDrop}
            onClick={handlePlayedAreaClick}
          >
            {playedCards.length === 0 ? (
              <div className="play-placeholder">
                {selectedCard && isPlayerTurn() ? 'Tap to play' : 'Play here'}
              </div>
            ) : (
              playedCards.slice(-3).map((card, index) => (
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

      {/* Action Buttons */}
      {gamePhase === 'playing' && !isShuffling && !isDealing && (
        <div className="game-actions">
          {mustPickup && isPlayerTurn() ? (
            <button className="action-btn btn-pickup pulse-btn" onClick={doPickupCard}>
              <Package size={16} /> Pick Up Card
            </button>
          ) : (
            <>
              <button 
                className={`action-btn btn-move ${!isPlayerTurn() || hasPlayedCard ? 'disabled' : ''}`}
                onClick={handleMove}
                disabled={!isPlayerTurn() || hasPlayedCard}
              >
                <SkipForward size={16} /> Move
              </button>
              <button 
                className={`action-btn btn-lowxena ${!isPlayerTurn() || myPoints > 10 ? 'disabled' : ''}`}
                onClick={handleLowXena}
                disabled={!isPlayerTurn() || myPoints > 10}
                title={myPoints > 10 ? `Need ≤10 pts (you have ${myPoints})` : 'Call LowXena!'}
              >
                <Zap size={16} /> LowXena!
                {myPoints <= 10 && isPlayerTurn() && <span className="lowxena-points">{myPoints}pts</span>}
              </button>
            </>
          )}
        </div>
      )}

      {/* My Hand */}
      {currentUser && (
        <div className="my-hand-section">
          <div className="my-info-bar">
            <div className="my-avatar">
              <span className="my-avatar-letter">{currentUser.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="my-details">
              <span className="my-name">{currentUser.name} (You)</span>
              <span className="my-stats">
                {myCards.length} cards · {myPoints} pts · Score: {scores[currentUser.id] || 0}
                {myPoints <= 10 && <span className="lowxena-ready"> · LowXena Ready!</span>}
              </span>
            </div>
          </div>
          <div className="my-cards-fan">
            {myCards.map((card, i) => (
              <div
                key={card.id}
                className={`hand-card ${selectedCard?.id === card.id ? 'selected' : ''} ${draggingCard?.id === card.id ? 'dragging' : ''} ${!isPlayerTurn() ? 'not-my-turn' : ''}`}
                style={{ '--i': i, '--total': myCards.length }}
                draggable={isPlayerTurn() && !hasPlayedCard}
                onDragStart={(e) => handleDragStart(e, card)}
                onDragEnd={handleDragEnd}
                onClick={() => handleCardClick(card)}
              >
                <div className="playing-card svg-card">
                  <img src={getCardImage(card)} alt={`${card.value} of ${card.suit}`} className="card-svg-img" draggable="false" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shuffle Overlay */}
      {isShuffling && (
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

      {/* Dealing Overlay */}
      {isDealing && (
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

      {/* Round Result Overlay */}
      {gamePhase === 'roundResult' && roundResult && (
        <div className="overlay-screen round-result-overlay">
          <div className="overlay-content round-result-content">
            <h2 className="overlay-title">Round {roundResult.roundNumber} Complete!</h2>
            <div className="round-called-by">
              Called by <strong>{roundResult.calledBy?.name}</strong>
            </div>
            <div className="round-result-winner">
              <span className="trophy-icon"><Trophy size={28} /></span>
              <span>{roundResult.winner?.name} wins the round!</span>
            </div>
            <div className="round-scores-list">
              {roundResult.playerScores?.map(p => (
                <div key={p.id} className={`round-score-item ${p.id === roundResult.winner?.id ? 'round-winner-row' : ''}`}>
                  <span className="round-score-name">
                    <span className="inline-bot-icon">{p.id.startsWith('bot-') ? <BotIcon icon={getBotInfo(p.id)?.icon} size={16} /> : <User size={16} />}</span> {p.name}
                  </span>
                  <span className="round-score-hand">Hand: {p.handPoints} pts</span>
                  <span className="round-score-total">Total: {roundResult.newCumulativeScores?.[p.id] || 0} pts</span>
                </div>
              ))}
            </div>
            {roundResult.newlyEliminated?.length > 0 && (
              <div className="round-eliminated">
                {roundResult.newlyEliminated.map(p => (
                  <span key={p.id} className="eliminated-name"><Skull size={16} /> {p.name} eliminated!</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gamePhase === 'gameOver' && (
        <div className="overlay-screen game-win-overlay">
          <div className="overlay-content game-win-content">
            <div className="win-trophy">
              {gameWinner?.id === currentUser?.id ? <Trophy size={48} /> : <Frown size={48} />}
            </div>
            <h2 className="overlay-title game-win-title">
              {gameWinner?.id === currentUser?.id 
                ? 'You Win!' 
                : `${gameWinner?.name || 'Unknown'} Wins!`}
            </h2>
            {gameWinner?.id === currentUser?.id ? (
              <p className="win-subtitle">Great job! You mastered the practice round.</p>
            ) : (
              <p className="win-subtitle">Better luck next time! Keep practicing to earn more.</p>
            )}

            {authAPI.isAuthenticated() && (
              <div className="coin-reward-banner">
                {isSavingStats ? (
                  <span className="saving-coins-text animate-pulse">Securing your rewards...</span>
                ) : saveError ? (
                  <span className="coin-save-error">{saveError}</span>
                ) : (
                  <div className="coins-earned-display animate-pop">
                    <span className="coin-gold-glow"><Coins size={20} className="spinning-coin" /></span>
                    <span className="coins-earned-val">+{coinsEarned} Coins</span>
                    {updatedCoins !== null && (
                      <span className="total-coins-val">(Total: {updatedCoins})</span>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="game-over-actions">
              <button className="win-btn" onClick={handleRestart}>
                <RefreshCw size={16} /> Play Again
              </button>
              <button className="win-btn win-btn-secondary" onClick={() => navigate('/')}>
                <Home size={16} /> Home
              </button>
            </div>
            <div className="final-scores">
              <h3>Final Scores</h3>
              {players
                .sort((a, b) => {
                  const aElim = eliminatedPlayers.includes(a.id)
                  const bElim = eliminatedPlayers.includes(b.id)
                  if (aElim !== bElim) return aElim ? 1 : -1
                  return (scores[a.id] || 0) - (scores[b.id] || 0)
                })
                .map((p, i) => (
                  <div key={p.id} className={`final-score-row ${p.id === gameWinner?.id ? 'winner-row' : ''} ${eliminatedPlayers.includes(p.id) ? 'elim-row' : ''}`}>
                    <span>{i + 1}. <span className="inline-bot-icon">{p.id.startsWith('bot-') ? <BotIcon icon={getBotInfo(p.id)?.icon} size={16} /> : <User size={16} />}</span> {p.name}</span>
                    <span>{scores[p.id] || 0} pts {eliminatedPlayers.includes(p.id) ? '(OUT)' : ''}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Scoreboard Modal */}
      {showScoreboard && (
        <div className="modal-overlay" onClick={() => setShowScoreboard(false)}>
          <div className="game-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowScoreboard(false)}>✕</button>
            <h2 className="modal-heading"><BarChart3 size={20} style={{display:'inline', verticalAlign:'-3px', marginRight:'6px'}} /> Scoreboard</h2>
            <div className="round-info">Round {roundNumber} · Max 40 pts</div>
            <div className="scoreboard-list">
              {players
                .sort((a, b) => (scores[a.id] || 0) - (scores[b.id] || 0))
                .map((player, index) => (
                  <div key={player.id} className={`score-row ${eliminatedPlayers.includes(player.id) ? 'score-eliminated' : ''}`}>
                    <span className="score-rank">#{index + 1}</span>
                    <span className="score-name">
                      <span className="inline-bot-icon">{player.id.startsWith('bot-') ? <BotIcon icon={getBotInfo(player.id)?.icon} size={16} /> : <User size={16} />}</span> {player.name}
                      {eliminatedPlayers.includes(player.id) && ' (OUT)'}
                    </span>
                    <span className="score-pts">{scores[player.id] || 0} pts</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PracticeGame
