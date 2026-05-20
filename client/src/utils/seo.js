/**
 * LowXena — Dynamic SEO Manager
 * Updates meta tags, OG tags, Twitter cards, canonical URL, and robots per route.
 * Works with React Router to ensure each page has unique, optimized SEO.
 */

const BASE_URL = 'https://lowxena.com';
const OG_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = 'LowXena';
const TWITTER_CREATOR = '@dharmikgohil';

const SEO_CONFIG = {
  '/': {
    title: 'LowXena — Play Free Funny Multiplayer Card Game Online',
    description: 'Play LowXena free — a hilarious multiplayer card game with rewards that carry over. Quick 15-min sessions, solo or with friends. No download needed!',
    canonical: `${BASE_URL}/`,
    keywords: 'online card game, funny card game, multiplayer card game, free card game, browser card game, casual card game, play card game online, LowXena, carry rewards card game',
    ogTitle: 'LowXena — Free Funny Multiplayer Card Game Online',
    ogDescription: 'A hilarious multiplayer card game with persistent rewards. Quick 15-min sessions. No download — play instantly!',
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  },
  '/rules': {
    title: 'How to Play LowXena — Card Game Rules & Strategy Guide',
    description: 'Master LowXena card game with our complete rules guide. Learn card values, scoring, show rules, special combos, and winning strategies. Free browser card game.',
    canonical: `${BASE_URL}/rules`,
    keywords: 'LowXena rules, how to play LowXena, card game rules, LowXena strategy, card game guide, least count rules, card values',
    ogTitle: 'How to Play LowXena — Rules & Strategy Guide',
    ogDescription: 'Complete LowXena card game rules. Card values, scoring, combos, and strategies to win.',
    robots: 'index, follow',
  },
  '/rooms': {
    title: 'Game Rooms — Join Multiplayer Card Games Online | LowXena',
    description: 'Browse and join open LowXena game rooms or create your own. Play multiplayer card games with friends online — private or public matches. Join free!',
    canonical: `${BASE_URL}/rooms`,
    keywords: 'LowXena rooms, multiplayer card game rooms, play card game with friends online, join game room, online card game lobby',
    ogTitle: 'Game Rooms — Join Multiplayer Card Games | LowXena',
    ogDescription: 'Browse open game rooms or create your own. Play with friends — private or public matches!',
    robots: 'index, follow',
  },
  '/practice': {
    title: 'Practice Mode — Play LowXena Card Game vs AI Free',
    description: 'Practice LowXena card game against smart AI opponents. Perfect your strategy, learn card combos, and get ready for multiplayer. Free single player mode.',
    canonical: `${BASE_URL}/practice`,
    keywords: 'LowXena practice, single player card game, play against AI, card game practice, free single player, LowXena AI',
    ogTitle: 'Practice Mode — Play LowXena vs AI',
    ogDescription: 'Practice against AI opponents. Master your strategy before multiplayer competition.',
    robots: 'index, follow',
  },
  '/quickmatch': {
    title: 'Quick Match — Instant LowXena Card Game | Find Opponents',
    description: 'Jump into a LowXena card game instantly. Quick match finds opponents in seconds. Free browser multiplayer card game — no waiting!',
    canonical: `${BASE_URL}/quickmatch`,
    keywords: 'LowXena quick match, instant card game, fast multiplayer, find opponents, ranked card game',
    ogTitle: 'Quick Match — Instant LowXena Game',
    ogDescription: 'Get matched instantly. Start playing in seconds — no waiting!',
    robots: 'noindex, follow',
  },
  '/game': {
    title: 'Playing LowXena — Live Card Game Session',
    description: 'You are in a live LowXena card game session. Focus on your cards and outsmart your opponents!',
    canonical: `${BASE_URL}/game`,
    keywords: 'LowXena game, live card game, playing LowXena',
    ogTitle: 'LowXena — Live Game',
    ogDescription: 'Live card game session in progress.',
    robots: 'noindex, nofollow',
  },
  '/room': {
    title: 'Game Lobby — Waiting for Players | LowXena',
    description: 'Waiting in a LowXena game lobby. Players are joining — get ready to play the funniest card game online!',
    canonical: `${BASE_URL}/room`,
    keywords: 'LowXena lobby, game waiting room, multiplayer lobby',
    ogTitle: 'Game Lobby — LowXena',
    ogDescription: 'Players are joining the lobby. Game starts soon!',
    robots: 'noindex, nofollow',
  },
};

// Match dynamic routes like /room/abc123 to their base config
function getConfigForPath(path) {
  if (SEO_CONFIG[path]) return SEO_CONFIG[path];
  if (path.startsWith('/room/')) return SEO_CONFIG['/room'];
  if (path.startsWith('/game')) return SEO_CONFIG['/game'];
  return SEO_CONFIG['/'];
}

// Helper: set or create a meta tag
function setMeta(attr, attrValue, content) {
  let el = document.querySelector(`meta[${attr}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

// Helper: set or create a link tag
function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function updateSEO(path) {
  const config = getConfigForPath(path);

  // Title
  document.title = config.title;

  // Standard meta tags
  setMeta('name', 'description', config.description);
  setMeta('name', 'keywords', config.keywords);
  setMeta('name', 'robots', config.robots);

  // Canonical URL
  setLink('canonical', config.canonical);

  // Open Graph tags
  setMeta('property', 'og:title', config.ogTitle);
  setMeta('property', 'og:description', config.ogDescription);
  setMeta('property', 'og:url', config.canonical);
  setMeta('property', 'og:image', OG_IMAGE);
  setMeta('property', 'og:site_name', SITE_NAME);
  setMeta('property', 'og:type', 'website');

  // Twitter Card tags
  setMeta('name', 'twitter:title', config.ogTitle);
  setMeta('name', 'twitter:description', config.ogDescription);
  setMeta('name', 'twitter:image', OG_IMAGE);
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:creator', TWITTER_CREATOR);
}
