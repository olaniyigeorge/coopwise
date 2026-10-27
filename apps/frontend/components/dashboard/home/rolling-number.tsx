'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface RollingNumberProps {
  value: number
  format: (value: number) => string
  className?: string
}

/** Counts from the previous value (0 on first paint) up to `value`. */
export default function RollingNumber({
  value,
  format,
  className,
}: RollingNumberProps) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    const to = Number.isFinite(value) ? value : 0
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (reduceMotion || to === fromRef.current) {
      fromRef.current = to
      setDisplay(to)
      return
    }

    const from = fromRef.current
    const start = performance.now()
    const duration = 900
    let frame = 0

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setDisplay(from + (to - from) * eased)
      if (t < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
        setDisplay(to)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return (
    <span className={cn('tabular-nums', className)}>{format(display)}</span>
  )
}
