"use client"

import { useEffect } from "react"
import { AUTH_EVENTS } from "@/lib/auth/events"
import useAuthStore from "@/stores/auth-store"


export default function AuthListener() {
  const clearAuth = useAuthStore(
    (state) => state.clearAuthLocal
  )

  useEffect(() => {
    const handler = () => {
      clearAuth()
    }

    window.addEventListener(
      AUTH_EVENTS.INVALIDATED,
      handler
    )

    return () =>
      window.removeEventListener(
        AUTH_EVENTS.INVALIDATED,
        handler
      )
  }, [clearAuth])


  return null
}