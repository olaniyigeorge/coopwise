'use client'

import { useEffect } from 'react'


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';


export function PingBackend() {
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(API_URL) 
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
