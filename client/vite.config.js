import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Prerendering is opt-in via PRERENDER=1 so a missing optional dep never
// breaks the normal `npm run build`. `npm run build:seo` produces prerendered
// HTML for /, /rules, /about, /rooms, /practice.
//
// On Vercel the build container is missing the system libraries Puppeteer's
// bundled Chromium needs (libnspr4, libnss3, etc), so we swap in
// @sparticuz/chromium which ships a self-contained Chromium binary.
const PRERENDER = process.env.PRERENDER === '1'
const IS_SERVERLESS = !!(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NETLIFY
)

async function getServerlessChromium() {
  const mod = await import('@sparticuz/chromium')
  const chromium = mod.default || mod
  return {
    executablePath: await chromium.executablePath(),
    args: chromium.args,
  }
}

async function loadPrerenderPlugin() {
  if (!PRERENDER) return null
  try {
    const { default: PrerenderSPA } = await import('@prerenderer/rollup-plugin')

    const rendererOptions = {
      maxConcurrentRoutes: 2,
      renderAfterDocumentEvent: 'app-rendered',
      renderAfterTime: 8000,
      headless: true,
      timeout: 30000,
    }

    if (IS_SERVERLESS) {
      try {
        Object.assign(rendererOptions, await getServerlessChromium())
      } catch (err) {
        console.warn(
          '[prerender] @sparticuz/chromium not available — falling back to bundled puppeteer:',
          err.message
        )
      }
    }

    return PrerenderSPA({
      routes: ['/', '/rules', '/about', '/rooms', '/practice'],
      renderer: '@prerenderer/renderer-puppeteer',
      rendererOptions,
      postProcess(renderedRoute) {
        renderedRoute.html = renderedRoute.html.replace(
          /<noscript>[\s\S]*?<\/noscript>/g,
          ''
        )
        return renderedRoute
      },
    })
  } catch (err) {
    console.warn(
      '[prerender] disabled — plugin failed to initialize:',
      err.message
    )
    return null
  }
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
      target: 'es2019',
      minify: 'esbuild',
      cssMinify: true,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-oauth': ['@react-oauth/google', 'jwt-decode'],
            'vendor-lottie': ['lottie-react'],
            'vendor-icons': ['lucide-react'],
            // Dicebear is loaded on-demand by AvatarSVG; isolate the parts we
            // actually use (core + adventurer style) into a single chunk.
            'vendor-dicebear': ['@dicebear/core', '@dicebear/adventurer'],
          },
        },
      },
      cssCodeSplit: true,
    },
  }
})
