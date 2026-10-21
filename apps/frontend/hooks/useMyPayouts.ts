"use client"

import { useCallback, useEffect, useState } from "react"
import PayoutService, { MyPayout, PayoutStatus } from "@/services/payout-service"
import { getApiErrorDetail } from "@/lib/api-error"

export type { MyPayout, PayoutStatus }

export function useMyPayouts() {
  const [payouts, setPayouts] = useState<MyPayout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((value) => value + 1), [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    PayoutService.listMine()
      .then((data) => {
        if (!cancelled) setPayouts(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (cancelled) return
        const detail = getApiErrorDetail(err)
        setError(
          typeof detail === "string"
            ? detail
            : detail?.message || err?.message || "Failed to load payout history."
        )
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  return { payouts, isLoading, error, refetch }
}
