import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Prerendering is opt-in via PRERENDER=1 so a missing optional dep never breaks
// the normal `npm run build`. Run `npm run build:seo` to produce prerendered
// HTML for /, /rules, /about, /rooms, /practice.
const PRERENDER = process.env.PRERENDER === '1'

async function loadPrerenderPlugin() {
  if (!PRERENDER) return null
  const { default: PrerenderSPA } = await import('@prerenderer/rollup-plugin')
  return PrerenderSPA({
    routes: ['/', '/rules', '/about', '/rooms', '/practice'],
    renderer: '@prerenderer/renderer-puppeteer',
    rendererOptions: {
      maxConcurrentRoutes: 2,
      renderAfterDocumentEvent: 'app-rendered',
      renderAfterTime: 8000,
      headless: true,
      timeout: 30000,
    },
    postProcess(renderedRoute) {
      // Strip noscript fallback once content is pre-rendered
      renderedRoute.html = renderedRoute.html.replace(
        /<noscript>[\s\S]*?<\/noscript>/g,
        ''
      )
      return renderedRoute
    },
  })
}

export default defineConfig(async () => {
  const prerender = await loadPrerenderPlugin()
  return {
    plugins: [react(), prerender].filter(Boolean),
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: path.resolve(__dirname, 'dist'),
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-oauth': ['@react-oauth/google', 'jwt-decode'],
            'vendor-lottie': ['lottie-react'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
      cssCodeSplit: true,
    },
  }
})
