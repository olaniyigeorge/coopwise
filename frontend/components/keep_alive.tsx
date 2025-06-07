'use client'

import { useEffect } from 'react'

export function PingBackend() {
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('https://coopwise.onrender.com/ping') 
        .then((res) => {
          if (!res.ok) throw new Error('Ping failed')
          return res.json()
        })
        .then((data) => {
          console.log('Ping successful:', data)
        })
        .catch((err) => {
          console.error('Ping error:', err)
        })
    }, 15000) // 15 seconds

    return () => clearInterval(interval)
  }, [])

  return null 
}
