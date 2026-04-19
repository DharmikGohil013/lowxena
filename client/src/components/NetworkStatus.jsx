import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import './NetworkStatus.css'

const NetworkContext = createContext({
  isOnline: true,
  latencyMs: 0,
  isHighLatency: false,
  isSlow: false,
  lastError: null,
})

export function useNetwork() {
  return useContext(NetworkContext)
}

/**
 * Wrap your app or a subtree with this provider.
 * It tracks online/offline state, measures API latency,
 * and renders a non-blocking overlay only in the affected zone.
 *
 * <NetworkStatusProvider>
 *   <App />
 * </NetworkStatusProvider>
 */
export function NetworkStatusProvider({ children, apiBaseUrl }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [latencyMs, setLatencyMs] = useState(0)
  const [isHighLatency, setIsHighLatency] = useState(false)
  const [isSlow, setIsSlow] = useState(false)
  const [lastError, setLastError] = useState(null)
  const [showReconnecting, setShowReconnecting] = useState(false)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)

  // Track online/offline
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true)
      setShowReconnecting(false)
      setReconnectAttempt(0)
    }
    const goOffline = () => {
      setIsOnline(false)
      setShowReconnecting(true)
    }

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  // Periodic latency ping (every 10s when online, every 3s when reconnecting)
  const pingServer = useCallback(async () => {
    const baseUrl = apiBaseUrl || import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
    const url = baseUrl.replace(/\/api\/?$/, '') // hit health check root
    const start = performance.now()

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      })
      clearTimeout(timeout)

      const elapsed = Math.round(performance.now() - start)
      setLatencyMs(elapsed)
      setIsHighLatency(elapsed > 300)
      setIsSlow(elapsed > 150 && elapsed <= 300)
      setLastError(null)

      if (showReconnecting) {
        setShowReconnecting(false)
        setReconnectAttempt(0)
      }
    } catch {
      setLastError('Server unreachable')
      if (isOnline) {
        // Online but server is down
        setShowReconnecting(true)
        setReconnectAttempt(prev => prev + 1)
      }
    }
  }, [apiBaseUrl, isOnline, showReconnecting])

  useEffect(() => {
    // Initial ping
    pingServer()
    const interval = setInterval(pingServer, showReconnecting ? 3000 : 10000)
    return () => clearInterval(interval)
  }, [pingServer, showReconnecting])

  const contextValue = {
    isOnline,
    latencyMs,
    isHighLatency,
    isSlow,
    lastError,
  }

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
      {showReconnecting && (
        <ReconnectingOverlay
          isOnline={isOnline}
          attempt={reconnectAttempt}
          latencyMs={latencyMs}
        />
      )}
    </NetworkContext.Provider>
  )
}

/**
 * Non-blocking reconnection banner.
 * Does NOT freeze the entire app — just shows a bottom bar.
 */
function ReconnectingOverlay({ isOnline, attempt, latencyMs }) {
  return (
    <div className="network-reconnecting-bar" role="alert" aria-live="assertive">
      <div className="network-reconnecting-content">
        <div className="network-spinner" />
        <div className="network-reconnecting-text">
          {!isOnline ? (
            <>
              <strong>You're offline</strong>
              <span>Waiting for connection...</span>
            </>
          ) : (
            <>
              <strong>Reconnecting to server...</strong>
              <span>
                Attempt {attempt}
                {latencyMs > 0 && ` • ${latencyMs}ms`}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Inline latency indicator for specific UI zones.
 * Place inside a leaderboard, game board, or any component
 * to show a per-zone "slow connection" warning.
 *
 * <ZoneLatencyIndicator label="Leaderboard" />
 */
export function ZoneLatencyIndicator({ label = 'Data' }) {
  const { isHighLatency, isSlow, latencyMs } = useNetwork()

  if (!isHighLatency && !isSlow) return null

  return (
    <div className={`zone-latency-indicator ${isHighLatency ? 'high' : 'slow'}`}>
      <div className="zone-latency-dot" />
      <span>
        {isHighLatency
          ? `${label} may be delayed (${latencyMs}ms)`
          : `Slow connection (${latencyMs}ms)`}
      </span>
    </div>
  )
}

/**
 * Hook to wrap any async action with latency awareness.
 * Returns { execute, loading, error, latencyMs }
 *
 * Usage:
 *   const { execute, loading } = useApiWithLatency()
 *   const data = await execute(() => gameAPI.getLeaderboard())
 */
export function useApiWithLatency() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [callLatency, setCallLatency] = useState(0)

  const execute = useCallback(async (apiCall) => {
    setLoading(true)
    setError(null)
    const start = performance.now()

    try {
      const result = await apiCall()
      setCallLatency(Math.round(performance.now() - start))
      return result
    } catch (err) {
      setCallLatency(Math.round(performance.now() - start))
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { execute, loading, error, latencyMs: callLatency }
}
