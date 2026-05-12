const SEO_CONFIG = {
  '/': {
    title: 'LowXena — Free Multiplayer Browser Card Game | Play Instantly',
    description: 'Play LowXena free — a competitive multiplayer card game in your browser. Google login, live leaderboards, animated UI. No downloads. Challenge friends now!',
    canonical: 'https://lowxena.com/',
  },
  '/rules': {
    title: 'How to Play LowXena — Rules & Card Game Guide',
    description: 'Learn how to play LowXena card game. Complete rules, scoring system, card values, and winning strategies. Free browser multiplayer game.',
    canonical: 'https://lowxena.com/rules',
  },
  '/rooms': {
    title: 'Game Rooms — Join or Create a Match | LowXena',
    description: 'Browse open LowXena game rooms or create your own. Play card games with friends online — private or public matches. Join now!',
    canonical: 'https://lowxena.com/rooms',
  },
  '/practice': {
    title: 'Practice Mode — Learn LowXena Card Game Free',
    description: 'Practice LowXena card game against AI. Perfect your strategy before competing on the leaderboard.',
    canonical: 'https://lowxena.com/practice',
  },
  '/quickmatch': {
    title: 'Quick Match — Instant LowXena Game | Find Opponents Fast',
    description: 'Jump into a LowXena card game instantly. Quick match finds you opponents in seconds. Free browser multiplayer.',
    canonical: 'https://lowxena.com/quickmatch',
  },
  '/game': {
    title: 'Playing LowXena — Live Card Game',
    description: 'You are in a live LowXena game session.',
    canonical: 'https://lowxena.com/game',
  },
  '/room': {
    title: 'Game Lobby — LowXena',
    description: 'Waiting in a LowXena game lobby. Get ready to play!',
    canonical: 'https://lowxena.com/room',
  },
}

// Match dynamic routes like /room/abc123 to their base path
function getConfigForPath(path) {
  if (SEO_CONFIG[path]) return SEO_CONFIG[path];
  // Match /room/:id pattern
  if (path.startsWith('/room/')) return SEO_CONFIG['/room'];
  // Match /game with query params
  if (path.startsWith('/game')) return SEO_CONFIG['/game'];
  return SEO_CONFIG['/'];
}

export function updateSEO(path) {
  const config = getConfigForPath(path)
  document.title = config.title

  let metaDesc = document.querySelector('meta[name="description"]')
  if (metaDesc) {
    metaDesc.setAttribute('content', config.description)
  }

  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', config.canonical)
}

