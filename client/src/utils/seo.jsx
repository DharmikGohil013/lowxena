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
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}/` },
    ],
  },
  '/rules': {
    title: 'How to Play LowXena — Card Game Rules & Strategy Guide',
    description: 'Master LowXena card game with our complete rules guide. Learn card values, scoring, show rules, special combos, and winning strategies. Free browser card game.',
    canonical: `${BASE_URL}/rules`,
    keywords: 'LowXena rules, how to play LowXena, card game rules, LowXena strategy, card game guide, least count rules, card values',
    ogTitle: 'How to Play LowXena — Rules & Strategy Guide',
    ogDescription: 'Complete LowXena card game rules. Card values, scoring, combos, and strategies to win.',
    robots: 'index, follow, max-image-preview:large, max-snippet:-1',
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}/` },
      { name: 'Rules', item: `${BASE_URL}/rules` },
    ],
    extraJsonLd: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to Play LowXena Card Game',
      description: 'Step-by-step guide on how to play LowXena, the free funny browser-based multiplayer least-count card game.',
      totalTime: 'PT15M',
      estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '0' },
      supply: [{ '@type': 'HowToSupply', name: 'Standard deck of cards (in-game)' }],
      tool: [{ '@type': 'HowToTool', name: 'Web browser (Chrome, Firefox, Safari, Edge)' }],
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Open LowXena', text: 'Visit lowxena.com in any modern browser — no download required.', url: `${BASE_URL}/` },
        { '@type': 'HowToStep', position: 2, name: 'Pick a mode', text: 'Choose Practice (vs AI), Quick Match, or join a multiplayer Room.' },
        { '@type': 'HowToStep', position: 3, name: 'Lower your hand', text: 'Each turn, draw and discard to keep your hand value as low as possible. Aces = 1, face cards = 11–13, Wild = 0.' },
        { '@type': 'HowToStep', position: 4, name: 'Call Show', text: 'When your hand is low enough, call Show. If you have the lowest total, you score 0 — otherwise you get a penalty.' },
        { '@type': 'HowToStep', position: 5, name: 'Win', text: 'First player to reach the round limit with the lowest cumulative score wins the match and earns carry rewards.' },
      ],
    },
  },
  '/about': {
    title: 'About LowXena — The Inspiration, Tech Stack & Creators',
    description: 'Explore the vision, state-of-the-art tech stack (React 19, Node.js, Supabase), and game architecture behind LowXena—the ultimate 3D cosmic casino least-count card game. Meet developer Dharmik Gohil!',
    canonical: `${BASE_URL}/about`,
    keywords: 'about LowXena, LowXena technology stack, React card game architecture, indie game development, Xenaplay Studio, Dharmik Gohil, least-count philosophy',
    ogTitle: 'About LowXena — Modern Card Game Architecture',
    ogDescription: 'Discover the inspiration, technology, and developer behind LowXena: a premium 3D browser card game.',
    robots: 'index, follow, max-image-preview:large, max-snippet:-1',
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}/` },
      { name: 'About', item: `${BASE_URL}/about` },
    ],
    extraJsonLd: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About LowXena',
      url: `${BASE_URL}/about`,
      description: 'About LowXena, Xenaplay Studio, and creator Dharmik Gohil — the team and tech behind the funny browser card game.',
      mainEntity: {
        '@type': 'Organization',
        name: 'Xenaplay Studio',
        url: BASE_URL,
        logo: `${BASE_URL}/logo.png`,
        founder: { '@type': 'Person', name: 'Dharmik Gohil', url: 'https://dharmikgohil.art' },
      },
    },
  },
  '/rooms': {
    title: 'Game Rooms — Join Multiplayer Card Games Online | LowXena',
    description: 'Browse and join open LowXena game rooms or create your own. Play multiplayer card games with friends online — private or public matches. Join free!',
    canonical: `${BASE_URL}/rooms`,
    keywords: 'LowXena rooms, multiplayer card game rooms, play card game with friends online, join game room, online card game lobby',
    ogTitle: 'Game Rooms — Join Multiplayer Card Games | LowXena',
    ogDescription: 'Browse open game rooms or create your own. Play with friends — private or public matches!',
    robots: 'index, follow',
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}/` },
      { name: 'Rooms', item: `${BASE_URL}/rooms` },
    ],
  },
  '/practice': {
    title: 'Practice Mode — Play LowXena Card Game vs AI Free',
    description: 'Practice LowXena card game against smart AI opponents. Perfect your strategy, learn card combos, and get ready for multiplayer. Free single player mode.',
    canonical: `${BASE_URL}/practice`,
    keywords: 'LowXena practice, single player card game, play against AI, card game practice, free single player, LowXena AI',
    ogTitle: 'Practice Mode — Play LowXena vs AI',
    ogDescription: 'Practice against AI opponents. Master your strategy before multiplayer competition.',
    robots: 'index, follow',
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}/` },
      { name: 'Practice', item: `${BASE_URL}/practice` },
    ],
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

function buildBreadcrumbJsonLd(crumbs) {
  if (!crumbs || !crumbs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: c.name,
      item: c.item,
    })),
  };
}

export function SEO({ path, roomName }) {
  const baseConfig = getConfigForPath(path);
  const config = { ...baseConfig };

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

  const breadcrumbLd = buildBreadcrumbJsonLd(config.breadcrumbs);

  return (
    <Helmet>
      <title>{config.title}</title>

      <meta name="description" content={config.description} />
      <meta name="keywords" content={config.keywords} />
      <meta name="robots" content={config.robots} />

      <link rel="canonical" href={config.canonical} />
      <link rel="alternate" hrefLang="en" href={config.canonical} />
      <link rel="alternate" hrefLang="x-default" href={config.canonical} />

      <meta property="og:title" content={config.ogTitle || config.title} />
      <meta property="og:description" content={config.ogDescription || config.description} />
      <meta property="og:url" content={config.canonical} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:alt" content={`${config.ogTitle || config.title} — preview`} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_US" />

      <meta name="twitter:title" content={config.ogTitle || config.title} />
      <meta name="twitter:description" content={config.ogDescription || config.description} />
      <meta name="twitter:image" content={OG_IMAGE} />
      <meta name="twitter:image:alt" content={`${config.ogTitle || config.title} — preview`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={TWITTER_CREATOR} />

      {breadcrumbLd && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbLd)}
        </script>
      )}
      {config.extraJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(config.extraJsonLd)}
        </script>
      )}
    </Helmet>
  );
}
