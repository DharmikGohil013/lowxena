import React from 'react';
import { Helmet } from 'react-helmet-async';

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
  '/about': {
    title: 'About LowXena — The Inspiration, Tech Stack & Creators',
    description: 'Explore the vision, state-of-the-art tech stack (React 19, Node.js, Supabase), and game architecture behind LowXena—the ultimate 3D cosmic casino least-count card game. Meet developer Dharmik Gohil!',
    canonical: `${BASE_URL}/about`,
    keywords: 'about LowXena, LowXena technology stack, React card game architecture, indie game development, Xenaplay Studio, Dharmik Gohil, least-count philosophy',
    ogTitle: 'About LowXena — Modern Card Game Architecture',
    ogDescription: 'Discover the inspiration, technology, and developer behind LowXena: a premium 3D browser card game.',
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

function getConfigForPath(path) {
  if (SEO_CONFIG[path]) return SEO_CONFIG[path];
  if (path.startsWith('/room/')) return SEO_CONFIG['/room'];
  if (path.startsWith('/game')) return SEO_CONFIG['/game'];
  return SEO_CONFIG['/'];
}

export function SEO({ path, roomName }) {
  const baseConfig = getConfigForPath(path);
  const config = { ...baseConfig };

  // Expert-Level Dynamic Overrides
  if (path.startsWith('/room/') && roomName) {
    const formattedRoom = roomName.trim();
    config.title = `LowXena — Waiting in Room ${formattedRoom} Lobby`;
    config.description = `Join room "${formattedRoom}" and play LowXena, the ultimate free online multiplayer card game. Join the cosmic table and start playing!`;
    config.canonical = `${BASE_URL}${path}`;
  } else if (path.startsWith('/game') && roomName) {
    const formattedRoom = roomName.trim();
    config.title = `LowXena — Live Playing in Room ${formattedRoom}`;
    config.description = `Active least-count card gameplay session in room "${formattedRoom}" on LowXena. Beat your opponents with the lowest hand score!`;
    config.canonical = `${BASE_URL}${path}`;
  }

  return (
    <Helmet>
      {/* Google AdSense site ownership verification */}
      <script 
        async 
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4658801537271443"
        crossorigin="anonymous"
      />

      {/* Title */}
      <title>{config.title}</title>

      {/* Standard Meta Tags */}
      <meta name="description" content={config.description} />
      <meta name="keywords" content={config.keywords} />
      <meta name="robots" content={config.robots} />

      {/* Canonical Link */}
      <link rel="canonical" href={config.canonical} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={config.ogTitle || config.title} />
      <meta property="og:description" content={config.ogDescription || config.description} />
      <meta property="og:url" content={config.canonical} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />

      {/* Twitter Cards */}
      <meta name="twitter:title" content={config.ogTitle || config.title} />
      <meta name="twitter:description" content={config.ogDescription || config.description} />
      <meta name="twitter:image" content={OG_IMAGE} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={TWITTER_CREATOR} />
    </Helmet>
  );
}
