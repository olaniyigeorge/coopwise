'use client'

import { useEffect, useState } from 'react'

// Disable keep alive completely during development to avoid console errors
const ENABLE_KEEP_ALIVE = process.env.NODE_ENV === 'production'

export function PingBackend() {
  const [pingStatus, setPingStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    // Skip ping in development to avoid console errors
    if (!ENABLE_KEEP_ALIVE) return

    // Initial ping after component mounts
    pingServer()
    
    // Set up interval for subsequent pings
    const interval = setInterval(pingServer, 30000) // 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Ping function that catches its own errors
  const pingServer = async () => {
    try {
      // Use built-in API endpoint that should always work
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add cache control to avoid caching issues
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      if (!response.ok) {
        setPingStatus('error')
        return
      }
      
      setPingStatus('success')
    } catch (err) {
      // Silently fail - don't log errors to console
      setPingStatus('error')
    }
  }

  // Component doesn't render anything visible
  return null
}
