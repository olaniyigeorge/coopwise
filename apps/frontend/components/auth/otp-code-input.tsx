'use client'

import { forwardRef, useEffect, useRef, useState } from 'react'

const LENGTH = 6

interface OtpCodeInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

/** Six boxes. A digit is written once, then focus moves after the key is finished. */
const OtpCodeInput = forwardRef<HTMLDivElement, OtpCodeInputProps>(
  function OtpCodeInput({ value, onChange, disabled = false }, ref) {
    const refs = useRef<(HTMLInputElement | null)[]>([])
    const codeRef = useRef(value)
    const [code, setCode] = useState(value)
    const digits = Array.from({ length: LENGTH }, (_, index) => code[index] ?? '')

    useEffect(() => {
      if (value === codeRef.current) return
      codeRef.current = value
      setCode(value)
    }, [value])

    useEffect(() => {
      refs.current[0]?.focus()
    }, [])

    function currentDigits() {
      return Array.from({ length: LENGTH }, (_, index) => codeRef.current[index] ?? '')
    }

    function write(next: string[], focusIndex: number) {
      const joined = next.join('').replace(/\D/g, '').slice(0, LENGTH)
      codeRef.current = joined
      setCode(joined)
      onChange(joined)
      // Move focus after this key event ends. Focusing inside the event
      // also drops the same digit into the next box.
      window.setTimeout(() => {
        const target = Math.max(0, Math.min(focusIndex, LENGTH - 1))
        const element = refs.current[target]
        element?.focus()
        element?.select()
      }, 0)
    }

    function fillFrom(index: number, raw: string) {
      const incoming = raw.replace(/\D/g, '')
      if (!incoming) return
      const next = currentDigits()
      incoming.split('').forEach((digit, offset) => {
        if (index + offset < LENGTH) next[index + offset] = digit
      })
      write(next, Math.min(index + incoming.length, LENGTH - 1))
    }

    return (
      <div ref={ref} className="flex justify-center gap-2 sm:gap-2.5">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element
            }}
            value={digit}
            disabled={disabled}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={LENGTH}
            aria-label={`Digit ${index + 1} of ${LENGTH}`}
            className="h-14 w-11 rounded-xl border border-[#0B1712]/20 bg-white px-0 text-center text-2xl font-bold leading-[3.5rem] text-[#0B1712] caret-[#0B1712] outline-none focus:border-[#096157] focus:ring-2 focus:ring-[#096157]/25 disabled:opacity-50 sm:w-12"
            style={{
              color: '#0B1712',
              WebkitTextFillColor: '#0B1712',
              caretColor: '#0B1712',
            }}
            onKeyDown={(event) => {
              if (event.key === 'Backspace') {
                event.preventDefault()
                const next = currentDigits()
                if (next[index]) {
                  next[index] = ''
                  write(next, index)
                } else if (index > 0) {
                  next[index - 1] = ''
                  write(next, index - 1)
                }
                return
              }
              if (event.key === 'ArrowLeft' && index > 0) {
                event.preventDefault()
                refs.current[index - 1]?.focus()
                return
              }
              if (event.key === 'ArrowRight' && index < LENGTH - 1) {
                event.preventDefault()
                refs.current[index + 1]?.focus()
                return
              }
              if (/^\d$/.test(event.key)) {
                event.preventDefault()
                const next = currentDigits()
                next[index] = event.key
                write(next, index < LENGTH - 1 ? index + 1 : index)
              }
            }}
            onPaste={(event) => {
              const text = event.clipboardData.getData('text')
              if (!text) return
              event.preventDefault()
              fillFrom(index, text)
            }}
            onChange={(event) => {
              const raw = event.target.value.replace(/\D/g, '')
              // Keyboard entry is handled in onKeyDown. This covers paste
              // and email autofill, which deliver the whole code at once.
              if (raw.length > 1) fillFrom(index, raw)
            }}
          />
        ))}
      </div>
    )
  }
)

export default OtpCodeInput
