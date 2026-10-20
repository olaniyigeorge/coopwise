"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowRight, Loader2, MailCheck, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AuthShell } from "@/components/auth/auth-shell"

const CODE_LENGTH = 6
const RESEND_SECONDS = 119

export default function ResetPasswordCodeForm() {
  const router = useRouter()
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""))
  const [error, setError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [timer, setTimer] = useState(RESEND_SECONDS)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (timer <= 0) return
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
    return () => clearInterval(interval)
  }, [timer])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  const handleInputChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "")
    setError("")

    if (digits.length > 1) {
      const nextCode = [...code]
      digits
        .slice(0, CODE_LENGTH - index)
        .split("")
        .forEach((digit, offset) => {
          nextCode[index + offset] = digit
        })
      setCode(nextCode)
      inputRefs.current[Math.min(index + digits.length, CODE_LENGTH - 1)]?.focus()
      return
    }

    const nextCode = [...code]
    nextCode[index] = digits
    setCode(nextCode)

    if (digits && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const completeCode = code.join("")

    if (completeCode.length !== CODE_LENGTH) {
      setError("Enter the complete verification code.")
      return
    }

    setIsVerifying(true)
    try {
      // Backend code verification goes here.
      await Promise.resolve()
      router.push("/reset-password")
    } finally {
      setIsVerifying(false)
    }
  }

  const resendCode = () => {
    setTimer(RESEND_SECONDS)
    setCode(Array(CODE_LENGTH).fill(""))
    setError("")
    inputRefs.current[0]?.focus()
  }

  const complete = code.join("").length === CODE_LENGTH

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Enter verification code"
      subtitle="We sent a six-digit code to the email on your account."
      backHref="/forgot-password"
      backLabel="Use a different email"
      footer={
        timer > 0 ? (
          <span className="text-xs text-brand-ink/45">
            Didn&apos;t receive it? Resend in{" "}
            <span className="font-mono font-semibold text-brand-ink/70">{formatTime(timer)}</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={resendCode}
            className="inline-flex min-h-0 min-w-0 items-center gap-1.5 text-xs font-semibold text-brand-teal hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Resend code
          </button>
        )
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-2.5 rounded-xl border border-brand-gold/20 bg-brand-gold/[0.07] px-3.5 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-brand-gold">
            <MailCheck className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <p className="text-xs leading-relaxed text-brand-ink/55">
            Check your spam folder if it hasn&apos;t arrived within a minute.
          </p>
        </div>

        <div
          className="flex justify-center gap-2 sm:gap-2.5"
          role="group"
          aria-labelledby="verification-code-label"
        >
          <span id="verification-code-label" className="sr-only">
            Verification code
          </span>
          {Array.from({ length: CODE_LENGTH }).map((_, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={code[index]}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onFocus={(e) => e.currentTarget.select()}
              className="h-14 w-11 rounded-xl border border-brand-ink/15 bg-white/80 text-center font-display text-xl font-semibold text-brand-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-colors focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20 sm:w-12"
              aria-label={`Digit ${index + 1} of verification code`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-start justify-center gap-1.5 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={!complete || isVerifying}
          className="h-11 w-full rounded-xl bg-[#0E3B2E] text-sm font-semibold text-white hover:bg-[#0A2E24] disabled:bg-brand-ink/20 disabled:text-brand-ink/35"
        >
          {isVerifying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Verify code
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  )
}
