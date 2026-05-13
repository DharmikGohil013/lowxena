import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCardImage, getCardBack } from '../utils/cardImages'
import {
  Zap, Target, Package, BarChart3, Skull, SkipForward, Trophy, User,
  Play, Home, Frown, RefreshCw, Crown, Swords, ShieldHalf, Brain,
  Moon, Flame, Eye, Ghost, Sparkles, Star, Sun, CloudLightning,
  ChevronLeft, ChevronRight, Settings2, Minus, Plus, Lock, Unlock,
  TrendingUp, Heart, AlertTriangle, Clock, Award, Crosshair,
  ArrowLeft, Layers, Lightbulb, VolumeX, X
} from 'lucide-react'
import './Game.css'
import './QuickMatch.css'

// ─── Card Constants ─────────────────────────────────────
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades']
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }

const shuffleArray = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const getCardValue = (v) => {
  if (v === 'A') return 1
  if (v === 'J') return 11
  if (v === 'Q') return 12
  if (v === 'K') return 13
  return parseInt(v)
}

const calculateHandPoints = (cards) =>
  cards ? cards.reduce((t, c) => t + getCardValue(c.value), 0) : 0

// ─── Advanced Bot Pool (8 unique bots) ──────────────────
const ALL_BOTS = [
  { id: 'bot-1', name: 'Luna',    style: 'cautious',    icon: 'moon',     color: '#a78bfa', desc: 'Plays safe, waits for perfect hands' },
  { id: 'bot-2', name: 'Blaze',   style: 'aggressive',  icon: 'flame',    color: '#f97316', desc: 'Dumps high cards fast and hard' },
  { id: 'bot-3', name: 'Sage',    style: 'strategic',   icon: 'brain',    color: '#34d399', desc: 'Calculates odds, plays pairs wisely' },
  { id: 'bot-4', name: 'Phantom', style: 'bluffer',     icon: 'ghost',    color: '#94a3b8', desc: 'Unpredictable, calls LowXena early' },
  { id: 'bot-5', name: 'Viper',   style: 'counter',     icon: 'eye',      color: '#ef4444', desc: 'Tracks your moves and counters' },
  { id: 'bot-6', name: 'Nova',    style: 'adaptive',    icon: 'sparkles', color: '#ec4899', desc: 'Changes strategy mid-game' },
  { id: 'bot-7', name: 'Titan',   style: 'tank',        icon: 'shield',   color: '#3b82f6', desc: 'Holds cards long, survives rounds' },
  { id: 'bot-8', name: 'Storm',   style: 'rushdown',    icon: 'bolt',     color: '#eab308', desc: 'Races to call LowXena ASAP' },
]

const BotIcon = ({ icon, size = 18 }) => {
  switch (icon) {
    case 'moon':     return <Moon size={size} />
    case 'flame':    return <Flame size={size} />
    case 'brain':    return <Brain size={size} />
    case 'ghost':    return <Ghost size={size} />
    case 'eye':      return <Eye size={size} />
    case 'sparkles': return <Sparkles size={size} />
    case 'shield':   return <ShieldHalf size={size} />
    case 'bolt':     return <CloudLightning size={size} />
    default:         return <User size={size} />
  }
}

const StyleIcon = ({ style, size = 14 }) => {
  switch (style) {
    case 'cautious':   return <ShieldHalf size={size} />
    case 'aggressive': return <Swords size={size} />
    case 'strategic':  return <Brain size={size} />
    case 'bluffer':    return <Ghost size={size} />
    case 'counter':    return <Eye size={size} />
    case 'adaptive':   return <TrendingUp size={size} />
    case 'tank':       return <Heart size={size} />
    case 'rushdown':   return <Zap size={size} />
    default:           return <User size={size} />
  }
}

// ─── Difficulty Presets ─────────────────────────────────
const DIFFICULTY_PRESETS = {
  casual:    { label: 'Casual',    color: '#22c55e', thinkMs: 1800, mistakeRate: 0.35, lowxenaThreshold: 8, desc: 'Relaxed AI, lots of mistakes' },
  standard:  { label: 'Standard',  color: '#3b82f6', thinkMs: 1200, mistakeRate: 0.15, lowxenaThreshold: 9, desc: 'Balanced, fair challenge' },
  ranked:    { label: 'Ranked',    color: '#f59e0b', thinkMs: 900,  mistakeRate: 0.05, lowxenaThreshold: 10, desc: 'Smart bots, competitive' },
  nightmare: { label: 'Nightmare', color: '#ef4444', thinkMs: 600,  mistakeRate: 0.0,  lowxenaThreshold: 12, desc: 'Near-perfect play, ruthless' },
}

// ─── Component ──────────────────────────────────────────
function QuickMatch() {
  const navigate = useNavigate()

  // ── Setup config ──
  const [gamePhase, setGamePhase] = useState('setup')
  const [difficulty, setDifficulty] = useState('standard')
  const [numBots, setNumBots] = useState(3)
  const [maxPoints, setMaxPoints] = useState(40)
  const [cardsPerHand, setCardsPerHand] = useState(7)
  const [lowxenaLimit, setLowxenaLimit] = useState(10)
  const [turnTime, setTurnTime] = useState(30)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedBots, setSelectedBots] = useState([0, 1, 2]) // indices into ALL_BOTS

  // ── Game state ──
  const [players, setPlayers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [deck, setDeck] = useState([])
  const [playerHands, setPlayerHands] = useState({})
  const [playedCards, setPlayedCards] = useState([])
  const [currentTurn, setCurrentTurn] = useState(null)
  const [scores, setScores] = useState({})
  const [roundNumber, setRoundNumber] = useState(1)
  const [eliminatedPlayers, setEliminatedPlayers] = useState([])
  const [mustPickup, setMustPickup] = useState(false)
  const [hasPlayedCard, setHasPlayedCard] = useState(false)
  const [countdown, setCountdown] = useState(30)

  // ── UI state ──
  const [selectedCard, setSelectedCard] = useState(null)
  const [draggingCard, setDraggingCard] = useState(null)
  const [dropHover, setDropHover] = useState(false)
  const [isShuffling, setIsShuffling] = useState(false)
  const [isDealing, setIsDealing] = useState(false)
  const [showScoreboard, setShowScoreboard] = useState(false)
  const [roundResult, setRoundResult] = useState(null)
  const [gameWinner, setGameWinner] = useState(null)
  const [botThinking, setBotThinking] = useState(null)
  const [botAction, setBotAction] = useState(null)
  const [showTips, setShowTips] = useState(true)
  const [currentTip, setCurrentTip] = useState(null)
  const [tipHistory, setTipHistory] = useState([])

  // ── Bot memory for complex AI ──
  const botMemory = useRef({})

  const botTimerRef = useRef(null)
  const tipTimerRef = useRef(null)

  // ── Init user ──
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('userData'))
      if (data) {
        setCurrentUser({ id: data.id || 'player-1', name: data.name || 'You' })
      } else {
        setCurrentUser({ id: 'player-1', name: 'You' })
      }
    } catch {
      setCurrentUser({ id: 'player-1', name: 'You' })
    }
  }, [])

  // ── Manage selected bots when numBots changes ──
  useEffect(() => {
    setSelectedBots(prev => {
      if (prev.length === numBots) return prev
      if (prev.length < numBots) {
        const all = Array.from({ length: 8 }, (_, i) => i)
        const available = all.filter(i => !prev.includes(i))
        return [...prev, ...available.slice(0, numBots - prev.length)]
      }
      return prev.slice(0, numBots)
    })
  }, [numBots])

  const getActiveBots = () => selectedBots.map(i => ALL_BOTS[i])

  // ── Tip system ──
  const showTipFn = useCallback((key, text, force = false) => {
    if (!showTips && !force) return
    if (!force && tipHistory.includes(key)) return
    setCurrentTip(text)
    setTipHistory(prev => [...prev, key])
    if (tipTimerRef.current) clearTimeout(tipTimerRef.current)
    tipTimerRef.current = setTimeout(() => setCurrentTip(null), 5000)
  }, [showTips, tipHistory])

  // ── Create deck (multiple decks for >4 players) ──
  const createDeck = (roundId) => {
    const totalCards = (numBots + 1) * cardsPerHand + 20 // need extra for draws
    const numDecks = Math.ceil(totalCards / 52)
    let fullDeck = []
    for (let d = 0; d < numDecks; d++) {
      SUITS.forEach(suit => {
        VALUES.forEach(value => {
          fullDeck.push({
            suit, value,
            id: `${value}-${suit}-d${d}-r${roundId}`,
            color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black'
          })
        })
      })
    }
    return shuffleArray(fullDeck)
  }

  // ═══════════════════════════════════════════════════════
  //  ADVANCED BOT AI
  // ═══════════════════════════════════════════════════════

  const initBotMemory = (bots) => {
    const mem = {}
    bots.forEach(b => {
      mem[b.id] = {
        cardsPlayed: [],        // cards the bot has seen played
        playerCalledLowxena: 0, // how many times player called lowxena
        roundsSurvived: 0,
        strategy: b.style,      // can change for adaptive bots
        aggression: 0.5,        // 0 = passive, 1 = full aggro
        lastRoundHandPts: null,
      }
    })
    botMemory.current = mem
  }

  const getBotDecision = (bot, hand, allScores, round) => {
    const diffConf = DIFFICULTY_PRESETS[difficulty]
    const pts = calculateHandPoints(hand)
    const mem = botMemory.current[bot.id] || {}
    const myScore = allScores[bot.id] || 0
    const maxPts = maxPoints

    // Mistake chance (easy bots sometimes make random plays)
    if (Math.random() < diffConf.mistakeRate) {
      return { action: 'random' }
    }

    // ── Should call LowXena? ──
    if (pts <= lowxenaLimit) {
      let callChance = 0

      switch (bot.style) {
        case 'aggressive':
          callChance = pts <= 8 ? 0.9 : pts <= lowxenaLimit ? 0.6 : 0
          break
        case 'cautious':
          callChance = pts <= 5 ? 0.8 : pts <= 7 ? 0.4 : 0.15
          break
        case 'strategic': {
          // Factor in opponent scores — call when others have high cumulative
          const othersAvgScore = Object.entries(allScores)
            .filter(([id]) => id !== bot.id && !eliminatedPlayers.includes(id))
            .reduce((s, [, v]) => s + v, 0) / Math.max(1, Object.keys(allScores).length - 1)
          callChance = pts <= 6 ? 0.85 : othersAvgScore > maxPts * 0.6 ? 0.7 : 0.3
          break
        }
        case 'bluffer':
          // Calls LowXena aggressively, even with risky hands
          callChance = pts <= lowxenaLimit ? 0.7 : 0
          if (round <= 2) callChance *= 1.3 // more aggressive early
          break
        case 'counter':
          // Waits for player to have high score, then calls
          const playerScore = allScores[currentUser?.id] || 0
          callChance = playerScore > maxPts * 0.5 && pts <= 8 ? 0.9 : pts <= 5 ? 0.7 : 0.2
          break
        case 'adaptive': {
          // Changes based on memory
          const wasLosingLastRound = mem.lastRoundHandPts !== null && mem.lastRoundHandPts > 15
          callChance = wasLosingLastRound ? (pts <= 9 ? 0.8 : 0.3) : (pts <= 6 ? 0.75 : 0.25)
          break
        }
        case 'tank':
          // Rarely calls, prefers to survive
          callChance = pts <= 3 ? 0.7 : pts <= 5 ? 0.3 : 0.05
          break
        case 'rushdown':
          // Calls as fast as possible
          callChance = pts <= lowxenaLimit ? 0.85 : 0
          break
        default:
          callChance = pts <= 7 ? 0.6 : 0.2
      }

      // Adjust for difficulty
      if (difficulty === 'nightmare') callChance = Math.min(callChance * 1.3, 0.95)
      if (difficulty === 'casual') callChance *= 0.6

      // Safety: if close to elimination, be more aggressive
      if (myScore > maxPts * 0.75) callChance = Math.min(callChance * 1.5, 0.95)

      if (Math.random() < callChance) {
        return { action: 'lowxena' }
      }
    }

    // ── Should skip (move)? ──
    let skipChance = 0
    switch (bot.style) {
      case 'cautious': skipChance = pts <= 12 ? 0.35 : 0.1; break
      case 'tank':     skipChance = pts <= 15 ? 0.45 : 0.2; break
      case 'aggressive': skipChance = 0.05; break
      case 'rushdown':   skipChance = pts <= lowxenaLimit + 3 ? 0.3 : 0.05; break
      case 'strategic':  skipChance = pts <= 10 ? 0.3 : 0.08; break
      case 'bluffer':    skipChance = Math.random() > 0.5 ? 0.4 : 0.05; break // unpredictable
      case 'counter':    skipChance = pts <= 14 ? 0.25 : 0.1; break
      case 'adaptive':   skipChance = (mem.aggression > 0.6) ? 0.05 : 0.3; break
      default:           skipChance = 0.15
    }
    if (difficulty === 'casual') skipChance *= 1.3
    if (difficulty === 'nightmare') skipChance *= 0.5

    if (Math.random() < skipChance) {
      return { action: 'skip' }
    }

    // ── Pick a card to play ──
    let cardToPlay
    const sorted = [...hand].sort((a, b) => getCardValue(b.value) - getCardValue(a.value))
    const valueCounts = {}
    hand.forEach(c => { valueCounts[c.value] = (valueCounts[c.value] || 0) + 1 })
    const pairs = hand.filter(c => valueCounts[c.value] >= 2)
    const highPairs = pairs.filter(c => getCardValue(c.value) >= 8)

    switch (bot.style) {
      case 'aggressive':
        cardToPlay = sorted[0] // always dump highest
        break
      case 'cautious':
        // Play middle card, protect low ones
        cardToPlay = sorted[Math.floor(sorted.length / 2)]
        break
      case 'strategic':
        // Prioritize high-value pairs, then highest single
        if (highPairs.length > 0) {
          cardToPlay = [...highPairs].sort((a, b) => getCardValue(b.value) - getCardValue(a.value))[0]
        } else if (pairs.length > 0) {
          cardToPlay = [...pairs].sort((a, b) => getCardValue(b.value) - getCardValue(a.value))[0]
        } else {
          cardToPlay = sorted[0]
        }
        break
      case 'bluffer':
        // Sometimes plays low cards to fake a bad hand
        cardToPlay = Math.random() > 0.6
          ? sorted[sorted.length - 1] // play lowest (bluff)
          : sorted[0]                 // play highest
        break
      case 'counter':
        // Play the card that maximizes opponent disadvantage (dump highest)
        cardToPlay = sorted[0]
        break
      case 'adaptive': {
        // Switch between aggressive and cautious based on score
        const losing = myScore > maxPts * 0.5
        if (losing) {
          // Aggressive when losing — dump high
          cardToPlay = sorted[0]
          botMemory.current[bot.id].aggression = Math.min(1, (mem.aggression || 0.5) + 0.1)
        } else {
          // Conservative when winning
          cardToPlay = sorted[Math.floor(sorted.length * 0.4)]
          botMemory.current[bot.id].aggression = Math.max(0, (mem.aggression || 0.5) - 0.1)
        }
        break
      }
      case 'tank':
        // Play lowest to keep hand balanced, survive longer
        cardToPlay = sorted[sorted.length - 1]
        break
      case 'rushdown':
        // Dump highest to get hand low ASAP
        if (pairs.length > 0) {
          cardToPlay = [...pairs].sort((a, b) => getCardValue(b.value) - getCardValue(a.value))[0]
        } else {
          cardToPlay = sorted[0]
        }
        break
      default:
        cardToPlay = sorted[0]
    }

    // Random action for 'random' (mistake)
    return { action: 'play', card: cardToPlay }
  }

  // ═══════════════════════════════════════════════════════
  //  GAME LOGIC
  // ═══════════════════════════════════════════════════════

  const startGame = () => {
    const user = currentUser || { id: 'player-1', name: 'You' }
    const bots = getActiveBots()
    const allPlayers = [user, ...bots]
    setPlayers(allPlayers)

    const initScores = {}
    allPlayers.forEach(p => { initScores[p.id] = 0 })
    setScores(initScores)
    setEliminatedPlayers([])
    setRoundNumber(1)
    setGameWinner(null)
    setRoundResult(null)
    initBotMemory(bots)

    setIsShuffling(true)
    setGamePhase('playing')
    showTipFn('welcome', 'Quick Match started! Play cards, keep your score low, call LowXena when ready.', true)

    setTimeout(() => {
      const shuffled = createDeck(1)
      setIsShuffling(false)
      setIsDealing(true)

      setTimeout(() => {
        const hands = {}
        allPlayers.forEach((p, i) => {
          hands[p.id] = shuffled.slice(i * cardsPerHand, (i + 1) * cardsPerHand)
        })
        const remaining = shuffled.slice(allPlayers.length * cardsPerHand)

        setDeck(remaining)
        setPlayerHands(hands)
        setPlayedCards([])
        setCurrentTurn(user.id)
        setMustPickup(false)
        setHasPlayedCard(false)
        setIsDealing(false)
        setCountdown(turnTime)
      }, 1200)
    }, 1500)
  }

  const startNewRound = (updatedScores, updatedEliminated, newRoundNum) => {
    const remaining = players.filter(p => !updatedEliminated.includes(p.id))
    if (remaining.length <= 1) {
      setGameWinner(remaining[0] || null)
      setGamePhase('gameOver')
      return
    }

    // Update bot memory for surviving bots
    remaining.forEach(p => {
      if (botMemory.current[p.id]) {
        botMemory.current[p.id].roundsSurvived++
        botMemory.current[p.id].lastRoundHandPts = calculateHandPoints(playerHands[p.id] || [])
      }
    })

    setIsShuffling(true)
    setRoundResult(null)
    setGamePhase('playing')

    setTimeout(() => {
      const shuffled = createDeck(newRoundNum)
      setIsShuffling(false)
      setIsDealing(true)

      setTimeout(() => {
        const hands = {}
        remaining.forEach((p, i) => {
          hands[p.id] = shuffled.slice(i * cardsPerHand, (i + 1) * cardsPerHand)
        })
        updatedEliminated.forEach(id => { hands[id] = [] })
        const remainingDeck = shuffled.slice(remaining.length * cardsPerHand)

        setDeck(remainingDeck)
        setPlayerHands(hands)
        setPlayedCards([])
        setCurrentTurn(remaining[0].id)
        setMustPickup(false)
        setHasPlayedCard(false)
        setIsDealing(false)
        setRoundNumber(newRoundNum)
        setCountdown(turnTime)
        setSelectedCard(null)
      }, 1200)
    }, 1500)
  }

  // ── Timer ──
  useEffect(() => {
    if (gamePhase !== 'playing' || !currentTurn) return
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (isPlayerTurn() && mustPickup) doPickupCard()
          else if (isPlayerTurn()) advanceTurn()
          return turnTime
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [gamePhase, currentTurn, mustPickup])

  // ── Bot turn trigger ──
  useEffect(() => {
    if (gamePhase !== 'playing') return
    if (!currentTurn || !currentTurn.startsWith('bot-')) return
    if (isShuffling || isDealing) return
    if (botTimerRef.current) clearTimeout(botTimerRef.current)

    const bot = players.find(p => p.id === currentTurn)
    if (!bot || eliminatedPlayers.includes(bot.id)) {
      advanceTurn()
      return
    }

    setBotThinking(bot.id)
    const thinkTime = DIFFICULTY_PRESETS[difficulty].thinkMs + Math.random() * 500

    botTimerRef.current = setTimeout(() => {
      executeBotTurn(bot)
    }, thinkTime)

    return () => { if (botTimerRef.current) clearTimeout(botTimerRef.current) }
  }, [currentTurn, gamePhase, isShuffling, isDealing])

  const isPlayerTurn = () => currentUser && currentTurn === currentUser.id

  const getActivePlayers = () => players.filter(p => !eliminatedPlayers.includes(p.id))

  const advanceTurn = useCallback(() => {
    const active = players.filter(p => !eliminatedPlayers.includes(p.id))
    if (active.length === 0) return
    const idx = active.findIndex(p => p.id === currentTurn)
    const next = active[(idx + 1) % active.length]

    setCurrentTurn(next.id)
    setMustPickup(false)
    setHasPlayedCard(false)
    setCountdown(turnTime)
    setSelectedCard(null)
    setBotThinking(null)
    setBotAction(null)

    if (next.id === currentUser?.id) {
      const myHand = playerHands[currentUser.id] || []
      const pts = calculateHandPoints(myHand)
      if (pts <= lowxenaLimit) showTipFn('lowxena', `Hand is ${pts} pts — you can call LowXena!`)
    }
  }, [players, eliminatedPlayers, currentTurn, currentUser, playerHands, showTipFn, turnTime, lowxenaLimit])

  // ── Execute bot turn using advanced AI ──
  const executeBotTurn = (bot) => {
    const hand = playerHands[bot.id] || []
    if (hand.length === 0) { advanceTurn(); return }

    const decision = getBotDecision(bot, hand, scores, roundNumber)

    if (decision.action === 'lowxena') {
      setBotAction({ botName: bot.name, action: 'calls LowXena!' })
      setBotThinking(null)
      setTimeout(() => executeRoundEnd(bot), 500)
      return
    }

    if (decision.action === 'skip') {
      setBotAction({ botName: bot.name, action: 'skips turn' })
      setBotThinking(null)
      setTimeout(() => advanceTurn(), 600)
      return
    }

    // Play card (or random card for mistakes)
    let cardToPlay = decision.card
    if (decision.action === 'random' || !cardToPlay) {
      cardToPlay = hand[Math.floor(Math.random() * hand.length)]
    }

    setBotAction({ botName: bot.name, action: `plays ${cardToPlay.value}${SUIT_SYMBOLS[cardToPlay.suit]}` })
    setBotThinking(null)

    // Track in memory
    if (botMemory.current[bot.id]) {
      botMemory.current[bot.id].cardsPlayed.push(cardToPlay)
    }

    setTimeout(() => doBotPlayCard(bot, cardToPlay), 500)
  }

  const doBotPlayCard = (bot, card) => {
    const hand = [...(playerHands[bot.id] || [])]
    const idx = hand.findIndex(c => c.id === card.id)
    if (idx === -1) { advanceTurn(); return }

    const cardsToPlay = [card]
    hand.splice(idx, 1)

    // Double play
    const matchIdx = hand.findIndex(c => c.value === card.value)
    if (matchIdx !== -1) {
      cardsToPlay.push(hand[matchIdx])
      hand.splice(matchIdx, 1)
      setBotAction(prev => prev ? { ...prev, action: `plays double ${card.value}${SUIT_SYMBOLS[card.suit]}!` } : prev)
    }

    setPlayerHands(prev => ({ ...prev, [bot.id]: hand }))
    setPlayedCards(prev => [...prev, ...cardsToPlay])

    setTimeout(() => doBotPickup(bot), 700)
  }

  const doBotPickup = (bot) => {
    if (deck.length === 0) { advanceTurn(); return }
    const newDeck = [...deck]
    const randomIdx = Math.floor(Math.random() * newDeck.length)
    const picked = newDeck.splice(randomIdx, 1)[0]
    const newHand = [...(playerHands[bot.id] || []), picked]

    setDeck(newDeck)
    setPlayerHands(prev => ({ ...prev, [bot.id]: newHand }))
    setTimeout(() => advanceTurn(), 400)
  }

  // ── Player actions ──
  const handlePlayCard = (card) => {
    if (!isPlayerTurn() || hasPlayedCard || !card) return
    const myId = currentUser.id
    const myHand = [...(playerHands[myId] || [])]
    const idx = myHand.findIndex(c => c.id === card.id)
    if (idx === -1) return

    const cardsToPlay = [card]
    myHand.splice(idx, 1)

    const matchIdx = myHand.findIndex(c => c.value === card.value)
    if (matchIdx !== -1) {
      cardsToPlay.push(myHand[matchIdx])
      myHand.splice(matchIdx, 1)
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
    }
  }

  const doPickupCard = () => {
    if (!isPlayerTurn() || !currentUser) return
    if (deck.length === 0) { advanceTurn(); return }
    const myId = currentUser.id
    const newDeck = [...deck]
    const randomIdx = Math.floor(Math.random() * newDeck.length)
    const picked = newDeck.splice(randomIdx, 1)[0]
    const newHand = [...(playerHands[myId] || []), picked]

    setDeck(newDeck)
    setPlayerHands(prev => ({ ...prev, [myId]: newHand }))
    setTimeout(() => advanceTurn(), 300)
  }

  const handleMove = () => {
    if (!isPlayerTurn() || hasPlayedCard) return
    advanceTurn()
  }

  const handleLowXena = () => {
    if (!isPlayerTurn() || !currentUser) return
    if (calculateHandPoints(playerHands[currentUser.id] || []) > lowxenaLimit) return
    executeRoundEnd(currentUser)
  }

  // ── Round end ──
  const executeRoundEnd = (calledBy) => {
    const active = getActivePlayers()
    const playerScoresRound = active.map(p => ({
      id: p.id,
      name: p.name,
      handPoints: calculateHandPoints(playerHands[p.id] || []),
      hand: playerHands[p.id] || []
    }))

    const minPts = Math.min(...playerScoresRound.map(p => p.handPoints))
    const roundWinner = playerScoresRound.find(p => p.handPoints === minPts)

    const newScores = { ...scores }
    playerScoresRound.forEach(p => {
      if (!newScores[p.id]) newScores[p.id] = 0
      newScores[p.id] += p.handPoints
    })
    if (roundWinner) newScores[roundWinner.id] = 0

    const newEliminated = [...eliminatedPlayers]
    const newlyEliminated = []
    active.forEach(p => {
      if (newScores[p.id] >= maxPoints && !newEliminated.includes(p.id)) {
        newEliminated.push(p.id)
        newlyEliminated.push(p)
      }
    })

    const remaining = players.filter(p => !newEliminated.includes(p.id))
    const isGameOver = remaining.length <= 1
    const winner = isGameOver ? (remaining[0] || null) : null

    setScores(newScores)
    setEliminatedPlayers(newEliminated)
    setRoundResult({
      winner: roundWinner,
      playerScores: playerScoresRound,
      newCumulativeScores: newScores,
      newlyEliminated,
      roundNumber,
      calledBy: { id: calledBy.id, name: calledBy.name },
    })
    setGamePhase('roundResult')

    setTimeout(() => {
      if (isGameOver) {
        setGameWinner(winner)
        setGamePhase('gameOver')
      } else {
        startNewRound(newScores, newEliminated, roundNumber + 1)
      }
    }, 4500)
  }

  // ── Card interaction handlers ──
  const handleCardClick = (card) => {
    if (!isPlayerTurn()) return
    setSelectedCard(prev => prev?.id === card.id ? null : card)
  }
  const handleDragStart = (e, card) => {
    if (!isPlayerTurn()) return
    setDraggingCard(card)
    setSelectedCard(null)
    e.dataTransfer.setData('text/plain', card.id)
  }
  const handleDragEnd = () => { setDraggingCard(null); setDropHover(false) }
  const handleDrop = (e) => { e.preventDefault(); setDropHover(false); if (draggingCard) handlePlayCard(draggingCard) }
  const handlePlayedAreaClick = () => { if (selectedCard && isPlayerTurn()) handlePlayCard(selectedCard) }
  const handlePickupClick = () => { if (mustPickup && isPlayerTurn()) doPickupCard() }

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
    botMemory.current = {}
  }

  const getBotInfo = (id) => ALL_BOTS.find(b => b.id === id)
  const myCards = currentUser ? (playerHands[currentUser.id] || []) : []
  const myPoints = calculateHandPoints(myCards)
  const otherPlayers = players.filter(p => p.id !== currentUser?.id)

  // ── Toggle bot selection ──
  const toggleBot = (botIndex) => {
    setSelectedBots(prev => {
      if (prev.includes(botIndex)) {
        if (prev.length <= 1) return prev
        const next = prev.filter(i => i !== botIndex)
        setNumBots(next.length)
        return next
      }
      if (prev.length >= 7) return prev
      const next = [...prev, botIndex]
      setNumBots(next.length)
      return next
    })
  }

  // ═══════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════

  // ── SETUP SCREEN ──
  if (gamePhase === 'setup') {
    return (
      <div className="game-container">
        <div className="game-background">
          <div className="stars"></div>
          <div className="game-gradient"></div>
        </div>

        <div className="qm-setup">
          <button className="qm-back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Back
          </button>

          <div className="qm-setup-card">
            <div className="qm-setup-header">
              <div className="qm-header-icon"><Zap size={36} /></div>
              <h1>Quick Match</h1>
              <p className="qm-subtitle">Customize your AI match and start playing</p>
            </div>

            {/* Difficulty */}
            <div className="qm-section">
              <label className="qm-label">Difficulty</label>
              <div className="qm-diff-grid">
                {Object.entries(DIFFICULTY_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    className={`qm-diff-btn ${difficulty === key ? 'active' : ''}`}
                    onClick={() => setDifficulty(key)}
                    style={{ '--diff-color': preset.color }}
                  >
                    <span className="qm-diff-dot" style={{ background: preset.color }} />
                    <span className="qm-diff-name">{preset.label}</span>
                    <span className="qm-diff-desc">{preset.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bot Selection */}
            <div className="qm-section">
              <label className="qm-label">
                Opponents
                <span className="qm-label-count">{numBots} selected</span>
              </label>
              <div className="qm-bots-grid">
                {ALL_BOTS.map((bot, index) => (
                  <button
                    key={bot.id}
                    className={`qm-bot-card ${selectedBots.includes(index) ? 'active' : ''}`}
                    onClick={() => toggleBot(index)}
                    style={{ '--bot-color': bot.color }}
                  >
                    <div className="qm-bot-select">
                      {selectedBots.includes(index) ? <Crosshair size={14} /> : <Plus size={14} />}
                    </div>
                    <div className="qm-bot-avatar" style={{ color: bot.color }}>
                      <BotIcon icon={bot.icon} size={22} />
                    </div>
                    <div className="qm-bot-info">
                      <span className="qm-bot-name">{bot.name}</span>
                      <span className="qm-bot-style">
                        <StyleIcon style={bot.style} size={12} />
                        {bot.style}
                      </span>
                    </div>
                    <span className="qm-bot-desc">{bot.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <button className="qm-advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
              <Settings2 size={16} />
              Advanced Settings
              {showAdvanced ? <ChevronLeft size={16} style={{ transform: 'rotate(-90deg)' }} /> : <ChevronRight size={16} style={{ transform: 'rotate(90deg)' }} />}
            </button>

            {showAdvanced && (
              <div className="qm-advanced">
                <div className="qm-adv-row">
                  <span className="qm-adv-label">
                    <Skull size={14} /> Max Points
                    <span className="qm-adv-hint">Elimination threshold</span>
                  </span>
                  <div className="qm-stepper">
                    <button onClick={() => setMaxPoints(Math.max(20, maxPoints - 10))}><Minus size={14} /></button>
                    <span className="qm-stepper-val">{maxPoints}</span>
                    <button onClick={() => setMaxPoints(Math.min(200, maxPoints + 10))}><Plus size={14} /></button>
                  </div>
                </div>

                <div className="qm-adv-row">
                  <span className="qm-adv-label">
                    <Layers size={14} /> Cards Per Hand
                    <span className="qm-adv-hint">Starting cards each round</span>
                  </span>
                  <div className="qm-stepper">
                    <button onClick={() => setCardsPerHand(Math.max(3, cardsPerHand - 1))}><Minus size={14} /></button>
                    <span className="qm-stepper-val">{cardsPerHand}</span>
                    <button onClick={() => setCardsPerHand(Math.min(10, cardsPerHand + 1))}><Plus size={14} /></button>
                  </div>
                </div>

                <div className="qm-adv-row">
                  <span className="qm-adv-label">
                    <Zap size={14} /> LowXena Limit
                    <span className="qm-adv-hint">Max hand pts to call LowXena</span>
                  </span>
                  <div className="qm-stepper">
                    <button onClick={() => setLowxenaLimit(Math.max(5, lowxenaLimit - 1))}><Minus size={14} /></button>
                    <span className="qm-stepper-val">{lowxenaLimit}</span>
                    <button onClick={() => setLowxenaLimit(Math.min(20, lowxenaLimit + 1))}><Plus size={14} /></button>
                  </div>
                </div>

                <div className="qm-adv-row">
                  <span className="qm-adv-label">
                    <Clock size={14} /> Turn Timer
                    <span className="qm-adv-hint">Seconds per turn</span>
                  </span>
                  <div className="qm-stepper">
                    <button onClick={() => setTurnTime(Math.max(10, turnTime - 5))}><Minus size={14} /></button>
                    <span className="qm-stepper-val">{turnTime}s</span>
                    <button onClick={() => setTurnTime(Math.min(120, turnTime + 5))}><Plus size={14} /></button>
                  </div>
                </div>
              </div>
            )}

            {/* Start Button */}
            <button className="qm-start-btn" onClick={startGame} disabled={numBots < 1}>
              <Play size={20} />
              Start Quick Match
              <span className="qm-start-info">{numBots + 1} players · {DIFFICULTY_PRESETS[difficulty].label}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════
  //  IN-GAME RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="game-container">
      <div className="game-background">
        <div className="stars"></div>
        <div className="game-gradient"></div>
      </div>

      {/* Top Bar */}
      <div className="game-top-bar">
        <div className="top-bar-left">
          <button className="control-btn" onClick={() => setShowScoreboard(true)} title="Scoreboard">
            <BarChart3 size={20} />
          </button>
        </div>

        <div className="turn-indicator">
          <span className="round-badge">R{roundNumber}</span>
          <span className="turn-label">
            {isPlayerTurn()
              ? (mustPickup ? <><Package size={14} /> Pick Up!</> : <><Target size={14} /> Your Turn</>)
              : currentTurn?.startsWith('bot-')
                ? <><span className="inline-bot-icon"><BotIcon icon={getBotInfo(currentTurn)?.icon} size={14} /></span> {getBotInfo(currentTurn)?.name}...</>
                : 'Waiting...'}
          </span>
          <span className={`turn-timer ${countdown <= 5 ? 'timer-danger' : ''}`}>{countdown}</span>
        </div>

        <div className="top-bar-right">
          <span className="qm-badge"><Zap size={12} /> QUICK</span>
          <span className="qm-diff-badge-sm" style={{ color: DIFFICULTY_PRESETS[difficulty].color, borderColor: DIFFICULTY_PRESETS[difficulty].color }}>
            {DIFFICULTY_PRESETS[difficulty].label}
          </span>
          <div className="practice-controls">
            <button className="control-btn" onClick={() => setShowTips(!showTips)} title="Toggle tips">
              {showTips ? <Lightbulb size={18} /> : <VolumeX size={18} />}
            </button>
            <button className="control-btn" onClick={handleRestart} title="Restart">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Tip Bar */}
      {currentTip && showTips && (
        <div className="qm-tip-bar" onClick={() => setCurrentTip(null)}>
          <Lightbulb size={14} /> {currentTip}
        </div>
      )}

      {/* Bot Action Toast */}
      {botAction && (
        <div className="bot-action-toast">
          <BotIcon icon={getBotInfo(players.find(p => p.name === botAction.botName)?.id)?.icon} size={16} />
          <strong>{botAction.botName}</strong> {botAction.action}
        </div>
      )}

      {/* Opponents Row */}
      <div className="opponents-row">
        {otherPlayers.map(player => {
          const bot = getBotInfo(player.id)
          const isElim = eliminatedPlayers.includes(player.id)
          const isActive = currentTurn === player.id
          const botHand = playerHands[player.id] || []
          return (
            <div key={player.id} className={`opponent-card ${isActive ? 'active-turn' : ''} ${isElim ? 'eliminated' : ''}`}>
              <div className="opponent-avatar" style={{ borderColor: bot?.color || '#666' }}>
                {botThinking === player.id && (
                  <div className="thinking-dots"><span /><span /><span /></div>
                )}
                <span className="opponent-letter"><BotIcon icon={bot?.icon} size={18} /></span>
              </div>
              <div className="opponent-info">
                <span className="opponent-name">{player.name}</span>
                <span className="opponent-score">Score: {scores[player.id] || 0}/{maxPoints}</span>
                <span className="opponent-cards">{botHand.length} cards</span>
                {bot && <span className="opponent-style" style={{ color: bot.color }}>
                  <StyleIcon style={bot.style} size={12} />
                </span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Game Table */}
      <div className="game-table">
        <div className="table-surface">
          {/* Deck */}
          <div className={`deck-area ${mustPickup && isPlayerTurn() ? 'deck-pickup-ready' : ''}`} onClick={handlePickupClick}>
            <div className="deck-stack">
              <div className="card-back"><div className="card-pattern" /></div>
            </div>
            <span className="deck-label">{deck.length} cards</span>
            {mustPickup && isPlayerTurn() && <span className="pickup-hint">Tap to draw</span>}
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
              playedCards.slice(-3).map((card, i) => (
                <div key={card.id} className="played-card" style={{
                  transform: `rotate(${(i * 7) - 7}deg) translateX(${(i - 1) * 12}px)`,
                  zIndex: i
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
              <Package size={16} /> Pick Up
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
                className={`action-btn btn-lowxena ${!isPlayerTurn() || myPoints > lowxenaLimit ? 'disabled' : ''}`}
                onClick={handleLowXena}
                disabled={!isPlayerTurn() || myPoints > lowxenaLimit}
                title={myPoints > lowxenaLimit ? `Need ≤${lowxenaLimit} pts (you have ${myPoints})` : 'Call LowXena!'}
              >
                <Zap size={16} /> LowXena!
                {myPoints <= lowxenaLimit && isPlayerTurn() && <span className="lowxena-points">{myPoints}pts</span>}
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
                {myCards.length} cards · {myPoints} pts · Score: {scores[currentUser.id] || 0}/{maxPoints}
                {myPoints <= lowxenaLimit && <span className="lowxena-ready"> · LowXena Ready!</span>}
              </span>
            </div>
          </div>

          <div className="my-cards-fan">
            {myCards.map((card, index) => {
              const total = myCards.length
              const mid = (total - 1) / 2
              const angle = (index - mid) * (total > 8 ? 4 : 6)
              const yOffset = Math.abs(index - mid) * (total > 8 ? 3 : 5)
              const isSelected = selectedCard?.id === card.id

              return (
                <div
                  key={card.id}
                  className={`hand-card ${isSelected ? 'card-selected' : ''} ${draggingCard?.id === card.id ? 'card-dragging' : ''}`}
                  style={{
                    transform: `rotate(${angle}deg) translateY(${yOffset}px) ${isSelected ? 'translateY(-20px)' : ''}`,
                    zIndex: isSelected ? 100 : index,
                  }}
                  onClick={() => handleCardClick(card)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="playing-card svg-card">
                    <img src={getCardImage(card)} alt={`${card.value} of ${card.suit}`} className="card-svg-img" draggable="false" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Shuffling Overlay */}
      {isShuffling && (
        <div className="overlay-screen">
          <div className="overlay-content">
            <div className="shuffle-cards">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="shuffle-card" style={{ animationDelay: `${i * 0.12}s` }}>
                  <div className="card-back"><div className="card-pattern" /></div>
                </div>
              ))}
            </div>
            <h2 className="overlay-title">Shuffling...</h2>
          </div>
        </div>
      )}

      {/* Dealing Overlay */}
      {isDealing && (
        <div className="overlay-screen">
          <div className="overlay-content">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flying-card" style={{ animationDelay: `${i * 0.3}s` }}>
                <div className="card-back"><div className="card-pattern" /></div>
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
                  <span className="round-score-total">Total: {roundResult.newCumulativeScores?.[p.id] || 0}</span>
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
              {gameWinner?.id === currentUser?.id ? <Trophy size={56} /> : <Frown size={56} />}
            </div>
            <h2 className="overlay-title game-win-title">
              {gameWinner?.id === currentUser?.id ? 'You Win!' : `${gameWinner?.name || 'Unknown'} Wins!`}
            </h2>
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
                  const aE = eliminatedPlayers.includes(a.id)
                  const bE = eliminatedPlayers.includes(b.id)
                  if (aE !== bE) return aE ? 1 : -1
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
            <button className="modal-close" onClick={() => setShowScoreboard(false)}>
              <X size={18} />
            </button>
            <h2 className="modal-heading"><BarChart3 size={20} style={{ display: 'inline', verticalAlign: '-3px', marginRight: '6px' }} /> Scoreboard</h2>
            <div className="round-info">Round {roundNumber} · Max {maxPoints} pts</div>
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

export default QuickMatch
