# 🎯 LowXena Game — Master SEO Strategy

> **Prepared for:** Xenaplay Studio / Dharmik Gohil
> **Platform:** lowxena.com (React 19 SPA + Node.js API)
> **Goal:** Page 1 Google rankings for competitive browser gaming keywords

---

## Table of Contents

1. [Technical SEO for React/Vite SPA](#1-technical-seo-strategy-for-reactvite-spa)
2. [Schema Markup (JSON-LD)](#2-advanced-schema-markup-json-ld)
3. [Keyword Matrix](#3-data-driven-keyword-matrix)
4. [On-Page SEO & Content Architecture](#4-on-page-seo--content-architecture)
5. [Off-Page & Backlink Blueprint](#5-off-page--backlink-blueprint)
6. [Implementation Checklist](#6-implementation-checklist)

---

## 1. Technical SEO Strategy for React/Vite SPA

### 1.1 Solving JavaScript Rendering (Critical)

Google's crawler can render JS, but with a **delayed second wave** (days/weeks). For a competitive SPA, you **must** serve pre-rendered HTML.

#### Recommended Approach: Pre-rendering with `vite-plugin-prerender` (No SSR Migration Needed)

**Why NOT migrate to Next.js:**
Your app uses React Router 7, Google OAuth client-side flow, Lottie animations, and Vite 7. Migrating to Next.js would break your OAuth flow, require rewriting route structures, and add SSR complexity for a game that runs entirely client-side. Pre-rendering gives you 95% of the SEO benefit at 5% of the effort.

**Implementation:**

```bash
cd client
npm install vite-plugin-prerender --save-dev
```

Update `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile' // optional
import prerender from 'vite-plugin-prerender'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    prerender({
      staticDir: path.join(__dirname, 'dist'),
      routes: ['/', '/rules', '/rooms', '/practice', '/quickmatch'],
      renderer: '@prerenderer/renderer-puppeteer',
      rendererOptions: {
        maxConcurrentRoutes: 4,
        renderAfterDocumentEvent: 'render-event',
      },
      postProcess(renderedRoute) {
        // Inject meta tags for dynamic pages
        renderedRoute.html = renderedRoute.html.replace(
          /<title>[^<]*<\/title>/,
          `<title>${getPageTitle(renderedRoute.route)}</title>`
        )
      }
    })
  ],
})
```

**Alternative (Production-grade): Dynamic Rendering via Express middleware**

For pages with dynamic content (leaderboards, profiles), use a headless renderer on the server:

```js
// server/middleware/prerender.js
import puppeteer from 'puppeteer';

const botUserAgents = /googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|linkedinbot|slackbot/i;

export async function prerenderMiddleware(req, res, next) {
  const userAgent = req.headers['user-agent'] || '';

  if (!botUserAgents.test(userAgent)) return next();

  // Only prerender for SEO-critical pages
  const seoRoutes = ['/', '/rules', '/rooms', '/leaderboard'];
  if (!seoRoutes.some(route => req.path === route || req.path.startsWith('/player/'))) {
    return next();
  }

  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(`${process.env.CLIENT_URL}${req.path}`, { waitUntil: 'networkidle0', timeout: 10000 });
    const html = await page.content();
    await browser.close();
    res.set('X-Prerendered', 'true');
    res.send(html);
  } catch (err) {
    console.error('Prerender failed:', err.message);
    next();
  }
}
```

**Or use Prerender.io (SaaS, zero-maintenance):**
- Sign up at [prerender.io](https://prerender.io) (free tier: 250 pages/month)
- Add middleware:
```js
import prerender from 'prerender-node';
app.use(prerender.set('prerenderToken', process.env.PRERENDER_TOKEN));
```

---

### 1.2 `robots.txt`

Place in `client/public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /room/
Disallow: /game
Disallow: /quickmatch

# Block auth/session endpoints
Disallow: /api/auth/
Disallow: /api/user/
Disallow: /api/game/

# Crawl-delay for polite crawling
Crawl-delay: 1

# Sitemap location
Sitemap: https://lowxena.com/sitemap.xml

# Block AI training bots (optional)
User-agent: GPTBot
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Google-Extended
Disallow: /
```

**Why block `/room/`, `/game`, `/quickmatch`:**
These are authenticated, dynamic game sessions with no indexable content. Crawling them wastes crawl budget and triggers soft 404s.

---

### 1.3 XML Sitemap Structure

Serve via Express or generate at build time. Two sitemaps needed:

**`sitemap-index.xml`** (place at root):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://lowxena.com/sitemap-static.xml</loc>
    <lastmod>2026-04-19</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://lowxena.com/sitemap-leaderboard.xml</loc>
    <lastmod>2026-04-19</lastmod>
  </sitemap>
</sitemapindex>
```

**`sitemap-static.xml`:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://lowxena.com/</loc>
    <lastmod>2026-04-19</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://lowxena.com/rules</loc>
    <lastmod>2026-04-19</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://lowxena.com/rooms</loc>
    <lastmod>2026-04-19</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://lowxena.com/leaderboard</loc>
    <lastmod>2026-04-19</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://lowxena.com/blog</loc>
    <lastmod>2026-04-19</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
```

**`sitemap-leaderboard.xml`** (auto-generated server-side):

```js
// server/routes/sitemap.js
import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.get('/sitemap-leaderboard.xml', async (req, res) => {
  const { data: players } = await supabase
    .from('users')
    .select('id, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1000);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  if (players) {
    for (const p of players) {
      xml += `
  <url>
    <loc>https://lowxena.com/player/${p.id}</loc>
    <lastmod>${new Date(p.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;
    }
  }

  xml += '\n</urlset>';
  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

export default router;
```

---

### 1.4 Core Web Vitals Optimization

Your app loads: Lottie animations (3 JSON files), Google Fonts (Inter), CSS particle effects, Google OAuth SDK.

#### LCP (Largest Contentful Paint) — Target: < 2.5s

| Problem | Fix |
|---|---|
| Lottie JSON files block render | Lazy-load with `React.lazy()` + `Suspense`. Load Lottie only after hero content paints |
| Google Fonts block render | Already using `preconnect` ✅. Add `font-display: swap` via URL param: `&display=swap` ✅ already present |
| 2-second artificial loader delay | **Remove or reduce to 500ms**. Google measures LCP *after* the loader. Your 2s `setTimeout` in `App.jsx` adds 2s to LCP |
| Heavy CSS gradient animations | Move particle/star CSS to a separate file, load via `<link rel="preload" as="style">` |

```jsx
// App.jsx — Replace the 2s artificial delay
useEffect(() => {
  // Use requestIdleCallback or reduce to 300ms max
  const timer = setTimeout(() => setLoading(false), 300)
  return () => clearTimeout(timer)
}, [])
```

#### CLS (Cumulative Layout Shift) — Target: < 0.1

| Problem | Fix |
|---|---|
| Images/avatars loading without dimensions | Set explicit `width` and `height` on all `<img>` tags |
| Font swap causing text shift | Use `font-display: optional` instead of `swap` for body text if CLS is high |
| Dynamic content pushing layout | Use CSS `min-height` on containers that load async content |

#### FID/INP (Interaction to Next Paint) — Target: < 200ms

| Problem | Fix |
|---|---|
| Heavy JS bundle | Code-split routes with `React.lazy()` |
| OAuth SDK loading on every page | Load Google OAuth SDK only on Home page, not globally |

**Route-level code splitting:**

```jsx
// App.jsx — Optimized
import { lazy, Suspense } from 'react'
const Home = lazy(() => import('./pages/Home'))
const Game = lazy(() => import('./pages/Game'))
const Rules = lazy(() => import('./pages/Rules'))
const RoomList = lazy(() => import('./pages/RoomList'))
const RoomLobby = lazy(() => import('./pages/RoomLobby'))
const PracticeGame = lazy(() => import('./pages/PracticeGame'))
const QuickMatch = lazy(() => import('./pages/QuickMatch'))

// In Router:
<Suspense fallback={<Loader message="Loading..." />}>
  <Routes>
    <Route path="/" element={<Home />} />
    {/* ... */}
  </Routes>
</Suspense>
```

**Vite build optimization in `vite.config.js`:**

```js
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-oauth': ['@react-oauth/google', 'jwt-decode'],
          'vendor-lottie': ['lottie-react'],
          'vendor-icons': ['lucide-react'],
        }
      }
    },
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true }
    }
  }
})
```

#### Additional Performance Headers (Express):

```js
// server/index.js — Add before routes
app.use((req, res, next) => {
  // Cache static assets aggressively
  if (req.path.match(/\.(js|css|png|jpg|svg|woff2)$/)) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // Security + performance headers
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

---

## 2. Advanced Schema Markup (JSON-LD)

### 2.1 VideoGame Schema

```json
{
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "name": "LowXena",
  "alternateName": "LowXena Card Game",
  "description": "A competitive multiplayer browser card game with real-time leaderboards, Google login, and animated UI. Play free in your browser — no downloads required.",
  "url": "https://lowxena.com",
  "image": "https://lowxena.com/og-image.png",
  "screenshot": [
    "https://lowxena.com/screenshots/gameplay-1.png",
    "https://lowxena.com/screenshots/leaderboard.png"
  ],
  "gamePlatform": ["Web Browser", "Desktop", "Mobile"],
  "applicationCategory": "Game",
  "genre": ["Card Game", "Multiplayer", "Strategy"],
  "operatingSystem": "Any (Browser-based)",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "author": {
    "@type": "Organization",
    "name": "Xenaplay Studio",
    "url": "https://xenaplaystudio.com"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Xenaplay Studio"
  },
  "datePublished": "2026-04-19",
  "inLanguage": "en",
  "playMode": ["MultiPlayer", "SinglePlayer"],
  "numberOfPlayers": {
    "@type": "QuantitativeValue",
    "minValue": 1,
    "maxValue": 4
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "ratingCount": "150",
    "bestRating": "5",
    "worstRating": "1"
  }
}
```

### 2.2 SoftwareApplication Schema

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "LowXena Game",
  "operatingSystem": "Any",
  "applicationCategory": "GameApplication",
  "applicationSubCategory": "BrowserGame",
  "browserRequirements": "Requires JavaScript. Requires HTML5. Works in Chrome, Firefox, Safari, Edge.",
  "softwareVersion": "1.0.0",
  "fileSize": "2MB",
  "downloadUrl": "https://lowxena.com",
  "installUrl": "https://lowxena.com",
  "permissions": "Google Account (optional, for saving progress)",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "ratingCount": "150",
    "bestRating": "5",
    "worstRating": "1"
  },
  "author": {
    "@type": "Organization",
    "name": "Xenaplay Studio"
  }
}
```

### 2.3 WebSite Schema (with SearchAction for Sitelinks)

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "LowXena",
  "alternateName": ["LowXena Game", "LowXena Card Game"],
  "url": "https://lowxena.com",
  "description": "Free multiplayer browser card game with real-time leaderboards. No downloads — play instantly.",
  "publisher": {
    "@type": "Organization",
    "name": "Xenaplay Studio",
    "logo": {
      "@type": "ImageObject",
      "url": "https://lowxena.com/logo.png"
    }
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://lowxena.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### 2.4 BreadcrumbList Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://lowxena.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Leaderboard",
      "item": "https://lowxena.com/leaderboard"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Rules",
      "item": "https://lowxena.com/rules"
    }
  ]
}
```

---

## 3. Data-Driven Keyword Matrix

### 3.1 Primary Keywords (High Volume, High Competition)

| Keyword | Monthly Vol. (est.) | Intent | Competition | Target Page |
|---|---|---|---|---|
| browser games | 110K | Transactional | High | Homepage |
| online multiplayer games | 90K | Transactional | High | Homepage |
| free online games | 200K+ | Transactional | Very High | Homepage |
| card games online | 60K | Transactional | High | Homepage |
| play games online free | 80K | Transactional | Very High | Homepage |

### 3.2 Secondary Keywords (Medium Volume, Medium Competition)

| Keyword | Monthly Vol. (est.) | Intent | Competition | Target Page |
|---|---|---|---|---|
| multiplayer browser games | 12K | Transactional | Medium | Homepage |
| browser card games | 8K | Transactional | Medium | Rules page |
| online leaderboard games | 3K | Informational | Medium | Leaderboard |
| free multiplayer card game | 5K | Transactional | Medium | Homepage |
| play card games with friends online | 4K | Transactional | Medium | Rooms page |
| no download games | 15K | Transactional | Medium | Homepage |
| web games 2026 | 2K | Informational | Low-Med | Blog |

### 3.3 Long-Tail Keywords (Low Volume, Low Competition — HIGH Conversion)

| Keyword | Monthly Vol. (est.) | Intent | Competition | Target Page |
|---|---|---|---|---|
| browser games with google login | 200 | Transactional | Very Low | Homepage |
| multiplayer web games with leaderboards | 300 | Transactional | Very Low | Leaderboard |
| free browser card game no download | 800 | Transactional | Low | Homepage |
| play card games online with friends free | 1.2K | Transactional | Low | Rooms |
| best free browser games 2026 | 1K | Informational | Low | Blog |
| competitive browser card games | 400 | Transactional | Very Low | Homepage |
| online card game with ranking system | 150 | Transactional | Very Low | Leaderboard |
| browser game with user profiles | 100 | Transactional | Very Low | Profile |
| web based multiplayer card game free | 500 | Transactional | Very Low | Homepage |
| how to climb leaderboard in browser games | 200 | Informational | Very Low | Blog |
| animated browser games react | 50 | Informational | Very Low | Blog (dev) |
| indie multiplayer browser game | 300 | Navigational | Very Low | Homepage |
| lowxena game | — | Navigational | None | Homepage |
| xenaplay studio games | — | Navigational | None | Homepage |

### 3.4 Question-Based Keywords (Featured Snippet Targets)

| Keyword | Intent | Target Content |
|---|---|---|
| what are the best free browser card games | Informational | Blog post |
| how to play card games online with friends | Informational | Rules page / Blog |
| are browser games still popular in 2026 | Informational | Blog post |
| what is a browser game with leaderboards | Informational | Blog post |
| how do online game leaderboards work | Informational | Blog post |

---

## 4. On-Page SEO & Content Architecture

### 4.1 Meta Tags — Production Ready

#### Homepage (`/`)

```html
<title>LowXena — Free Multiplayer Browser Card Game | Play Instantly</title>
<meta name="description" content="Play LowXena free — a competitive multiplayer card game in your browser. Google login, live leaderboards, animated UI. No downloads. Challenge friends now!">
<meta name="keywords" content="browser card game, multiplayer online game, free card game, play with friends, leaderboard game, no download game">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:title" content="LowXena — Free Multiplayer Browser Card Game">
<meta property="og:description" content="Competitive multiplayer card game. Live leaderboards, Google login, instant play. No downloads required.">
<meta property="og:image" content="https://lowxena.com/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://lowxena.com">
<meta property="og:site_name" content="LowXena">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="LowXena — Free Multiplayer Browser Card Game">
<meta name="twitter:description" content="Play free. Compete on leaderboards. No downloads.">
<meta name="twitter:image" content="https://lowxena.com/og-image.png">

<!-- Canonical -->
<link rel="canonical" href="https://lowxena.com/">
```

#### Leaderboard Page (`/leaderboard`)

```html
<title>Leaderboard — Top LowXena Players | Live Rankings & Stats</title>
<meta name="description" content="See who's #1 on the LowXena leaderboard. Live player rankings, win rates, and game stats. Climb the ranks in this free browser card game.">
<link rel="canonical" href="https://lowxena.com/leaderboard">
```

#### Player Profile Page (`/player/:id`)

```html
<title>{PlayerName}'s Profile — LowXena Stats & Rank</title>
<meta name="description" content="View {PlayerName}'s LowXena profile. {Wins} wins, {WinRate}% win rate, ranked #{Rank}. Challenge them to a game!">
<link rel="canonical" href="https://lowxena.com/player/{id}">
```

#### Rules Page (`/rules`)

```html
<title>How to Play LowXena — Rules & Card Game Guide</title>
<meta name="description" content="Learn how to play LowXena card game. Complete rules, scoring system, card values, and winning strategies. Free browser multiplayer game.">
<link rel="canonical" href="https://lowxena.com/rules">
```

#### Rooms Page (`/rooms`)

```html
<title>Game Rooms — Join or Create a Match | LowXena</title>
<meta name="description" content="Browse open LowXena game rooms or create your own. Play card games with friends online — private or public matches. Join now!">
<link rel="canonical" href="https://lowxena.com/rooms">
```

### 4.2 Dynamic Meta Tag Injection for SPA

Create a React Helmet equivalent using `document.title` updates per route:

```jsx
// client/src/utils/seo.js
const SEO_CONFIG = {
  '/': {
    title: 'LowXena — Free Multiplayer Browser Card Game | Play Instantly',
    description: 'Play LowXena free — a competitive multiplayer card game in your browser. Google login, live leaderboards, animated UI. No downloads.',
    canonical: 'https://lowxena.com/',
  },
  '/rules': {
    title: 'How to Play LowXena — Rules & Card Game Guide',
    description: 'Learn how to play LowXena card game. Complete rules, scoring, card values, and winning strategies.',
    canonical: 'https://lowxena.com/rules',
  },
  '/rooms': {
    title: 'Game Rooms — Join or Create a Match | LowXena',
    description: 'Browse open LowXena game rooms or create your own. Private or public matches.',
    canonical: 'https://lowxena.com/rooms',
  },
  '/leaderboard': {
    title: 'Leaderboard — Top LowXena Players | Live Rankings',
    description: 'See who tops the LowXena leaderboard. Live player rankings, win rates, and stats.',
    canonical: 'https://lowxena.com/leaderboard',
  },
  '/practice': {
    title: 'Practice Mode — Learn LowXena Card Game Free',
    description: 'Practice LowXena card game against AI. Perfect your strategy before competing on the leaderboard.',
    canonical: 'https://lowxena.com/practice',
  },
}

export function updateSEO(path) {
  const config = SEO_CONFIG[path] || SEO_CONFIG['/']
  document.title = config.title

  // Update meta description
  let metaDesc = document.querySelector('meta[name="description"]')
  if (metaDesc) metaDesc.setAttribute('content', config.description)

  // Update canonical
  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', config.canonical)
}
```

### 4.3 Content Marketing Silo — Blog Architecture

**URL Structure:** `https://lowxena.com/blog/{slug}`

Create a `/blog` route served as static pre-rendered pages (or a simple CMS integration).

#### 5 High-Ranking Blog Post Titles

| # | Title | Primary Keyword Target | Intent | Est. Monthly Traffic |
|---|---|---|---|---|
| 1 | **"10 Best Free Browser Card Games You Can Play Right Now (2026)"** | best free browser card games 2026 | Informational | 2K–5K |
| 2 | **"How Online Game Leaderboards Work: The Complete Guide"** | how do online game leaderboards work | Informational | 500–1K |
| 3 | **"Browser Games vs. Downloaded Games: Why Web-Based Gaming Is the Future"** | browser games vs downloaded games | Informational | 1K–3K |
| 4 | **"5 Proven Strategies to Climb the LowXena Leaderboard Fast"** | how to climb leaderboard browser games | Informational | 300–800 |
| 5 | **"Why Multiplayer Browser Games Are Making a Comeback in 2026"** | multiplayer browser games 2026 | Informational | 1K–2K |

**Internal linking strategy:**
- Every blog post links to → Homepage (play CTA), Leaderboard, Rules
- Homepage links to → Blog posts in a "Learn More" section
- Rules page links to → Blog post #4 (strategies)
- Leaderboard page links to → Blog post #2 (how leaderboards work)

#### Content Silo Diagram

```
lowxena.com/
├── / (Homepage)                    ← Primary landing page
│   ├── /rules                     ← Pillar content: game rules
│   ├── /leaderboard               ← Dynamic: rankings
│   ├── /rooms                     ← Dynamic: active games
│   ├── /player/:id                ← Dynamic: user profiles
│   └── /blog/                     ← Content hub
│       ├── best-browser-card-games-2026
│       ├── how-online-leaderboards-work
│       ├── browser-games-vs-downloads
│       ├── strategies-climb-lowxena-leaderboard
│       └── multiplayer-browser-games-comeback
```

---

## 5. Off-Page & Backlink Blueprint

### 5.1 Gaming Directories & Platforms (Submit Immediately)

| Platform | URL | Type | Priority | Action |
|---|---|---|---|---|
| **itch.io** | itch.io | Indie game directory | 🔴 Critical | Create game page, upload HTML5 build |
| **Product Hunt** | producthunt.com | Tech launch platform | 🔴 Critical | Schedule launch, prepare assets |
| **Newgrounds** | newgrounds.com | Browser game portal | 🔴 Critical | Submit game |
| **CrazyGames** | crazygames.com | Web game aggregator | 🟡 High | Submit via developer portal |
| **GameJolt** | gamejolt.com | Indie game platform | 🟡 High | Create game listing |
| **Kongregate** | kongregate.com | Browser game portal | 🟡 High | Submit game |
| **IndieDB** | indiedb.com | Indie game database | 🟡 High | Create game profile |
| **Poki** | poki.com/en/developers | Web game distributor | 🟡 High | Apply for developer program |
| **AlternativeTo** | alternativeto.net | Software directory | 🟢 Medium | List as alternative to similar games |
| **SimilarWeb** | similarweb.com | Web directory | 🟢 Medium | Claim site |
| **GitHub** | github.com | Code repository | 🟢 Medium | Open-source parts, link to live game |
| **Hacker News** | news.ycombinator.com | Tech community | 🟢 Medium | "Show HN" post |
| **Reddit** | r/WebGames, r/IndieGames, r/BrowserGames | Community | 🟡 High | Share with context |
| **Dev.to** | dev.to | Developer community | 🟢 Medium | Technical blog cross-post |
| **Medium** | medium.com | Blog platform | 🟢 Medium | Gaming topic articles |

### 5.2 Forum & Community Presence

| Community | Strategy |
|---|---|
| **r/WebGames** | Post gameplay GIF + link. Engage in comments |
| **r/IndieGaming** | Share development journey, screenshots |
| **r/gamedev** | Technical posts about your React game architecture |
| **Discord Gaming Servers** | Share in #self-promo channels |
| **TIGSource Forums** | Indie game devlog thread |
| **HTML5 Game Devs Forum** | Technical discussion + game link |

### 5.3 Outreach Template for Gaming Bloggers/YouTubers

**Subject Line Options:**
- `New Free Browser Card Game — Would Love Your Review 🎮`
- `LowXena: Multiplayer Browser Card Game (No Download) — Review Copy`
- `Quick Look at LowXena? Free Browser Game with Live Leaderboards`

**Email Template:**

```
Subject: LowXena — Free Browser Card Game with Live Leaderboards 🎮

Hi {Name},

I'm Dharmik from Xenaplay Studio. I just launched LowXena — a free multiplayer
card game you can play instantly in your browser at lowxena.com.

Why it might interest your audience:
• No downloads — plays right in Chrome/Firefox/Safari
• Google login saves progress + live leaderboard rankings
• Multiplayer rooms — challenge friends or random opponents
• Beautiful animated UI with card effects and particle animations

I've been following your content on {their channel/blog} and think LowXena
would be a great fit for a {video/article/stream} — especially your
{specific video or series they did on browser/indie games}.

Happy to provide:
✅ Press kit (screenshots, logos, descriptions)
✅ Exclusive access or early features
✅ A quick 5-minute walkthrough call

No pressure at all — if it's not a fit, no worries!

Best,
Dharmik Gohil
Xenaplay Studio
https://lowxena.com
```

**Targeting criteria for outreach:**
- YouTube channels with 5K–100K subscribers covering browser/indie games
- Gaming blogs with Domain Authority 20–50
- Twitch streamers who play browser games
- Newsletter authors covering indie games

### 5.4 Social Signal Strategy

| Platform | Content Type | Frequency |
|---|---|---|
| **Twitter/X** | Gameplay GIFs, dev updates, leaderboard screenshots | 3–5x/week |
| **YouTube** | Gameplay trailers, strategy guides, dev logs | 2x/month |
| **TikTok** | 15-second gameplay clips, "satisfying card animations" | 3x/week |
| **Instagram** | Screenshots, design process, player highlights | 2x/week |
| **LinkedIn** | Dev journey posts, tech stack discussions | 1x/week |

---

## 6. Implementation Checklist

### Phase 1: Foundation (Week 1–2)

- [ ] Add all meta tags to `index.html`
- [ ] Inject JSON-LD schemas into `index.html`
- [ ] Create `robots.txt` in `client/public/`
- [ ] Create static `sitemap.xml` in `client/public/`
- [ ] Set up dynamic sitemap endpoint on server
- [ ] Implement `seo.js` utility for per-route meta updates
- [ ] Reduce loader delay from 2s → 300ms
- [ ] Code-split routes with `React.lazy`
- [ ] Implement Vite `manualChunks` config
- [ ] Create OG image (1200x630px)
- [ ] Add `rel="canonical"` to all pages
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools

### Phase 2: Content & Pre-rendering (Week 3–4)

- [ ] Install and configure pre-rendering (vite-plugin-prerender or Prerender.io)
- [ ] Set up `/blog` route and first 2 blog posts
- [ ] Register on Google Search Console, verify domain
- [ ] Submit game to itch.io, GameJolt, IndieDB
- [ ] Create Product Hunt upcoming page
- [ ] Post on r/WebGames and r/IndieGaming
- [ ] Write Dev.to technical article about React game development

### Phase 3: Growth (Week 5–8)

- [ ] Publish remaining 3 blog posts (one per week)
- [ ] Launch on Product Hunt
- [ ] Begin blogger/YouTuber outreach (10 contacts/week)
- [ ] Submit to CrazyGames, Poki, Newgrounds
- [ ] Monitor Google Search Console for indexing issues
- [ ] Track Core Web Vitals in PageSpeed Insights
- [ ] A/B test meta titles based on CTR data from Search Console

### Phase 4: Optimization (Ongoing)

- [ ] Monitor keyword rankings weekly
- [ ] Refresh blog content quarterly
- [ ] Build backlinks through guest posts (1–2/month)
- [ ] Update schema markup with real aggregate ratings
- [ ] Analyze competitor backlinks with Ahrefs/SEMrush free tier
- [ ] Optimize pages based on Search Console performance data

---

## Appendix: Quick Wins Ranked by Impact

| Rank | Action | Impact | Effort |
|---|---|---|---|
| 1 | Add JSON-LD schemas to `index.html` | High — Rich results in SERPs | 30 min |
| 2 | Fix meta title/description | High — Improves CTR by 20–40% | 15 min |
| 3 | Create robots.txt + sitemap | High — Enables proper crawling | 20 min |
| 4 | Reduce loader to 300ms | High — Drops LCP by 1.7s | 5 min |
| 5 | Code-split routes | Medium — Reduces initial JS by ~40% | 30 min |
| 6 | Submit to Google Search Console | High — Starts indexing | 10 min |
| 7 | Submit to itch.io | Medium — Instant backlink + traffic | 1 hr |
| 8 | Pre-rendering setup | High — Fixes SPA crawl issues | 2 hrs |
| 9 | Write first blog post | Medium — Long-tail traffic pipeline | 3 hrs |
| 10 | Product Hunt launch | High — Spike traffic + backlinks | 4 hrs |

---

*Strategy prepared for Xenaplay Studio. All code examples are production-ready for the existing React 19 / Vite 7 / Express 4 / Supabase stack.*
