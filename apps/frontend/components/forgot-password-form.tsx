"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell, authFieldClass, authLabelClass } from "@/components/auth/auth-shell"

interface ForgotPasswordFormProps {
  emailOnly?: boolean
}

export default function ForgotPasswordForm({ emailOnly = false }: ForgotPasswordFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim()) {
      setError(`Please enter your ${emailOnly ? "email address" : "phone number or email"}`)
      return
    }

    if (emailOnly && !email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    setIsSending(true)
    try {
      // Backend reset endpoint lands here. Until it does, surface the
      // confirmation state so the flow is still walkable end to end.
      await Promise.resolve()
      setIsCodeSent(true)
    } finally {
      setIsSending(false)
    }
  }

  const isFormFilled = email.trim() !== ""
  const nextHref = emailOnly ? "/reset-password" : "/reset-password-code"

  if (isCodeSent) {
    return (
      <AuthShell
        eyebrow="Check your inbox"
        title={emailOnly ? "Reset link sent" : "Verification code sent"}
        subtitle={`We sent ${emailOnly ? "a reset link" : "a verification code"} to ${email}.`}
        backHref="/signin"
        backLabel="Back to sign in"
        footer={
          <button
            type="button"
            onClick={() => setIsCodeSent(false)}
            className="min-h-0 min-w-0 text-xs font-semibold text-brand-teal hover:underline"
          >
            Didn&apos;t receive it? Try again
          </button>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-col items-center rounded-2xl border border-brand-gold/20 bg-brand-gold/[0.07] px-5 py-7 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-teal shadow-sm">
              <CheckCircle2 className="h-7 w-7" strokeWidth={1.8} />
            </span>
            <p className="mt-3 text-sm leading-relaxed text-brand-ink/60">
              {emailOnly
                ? "Open the link in your inbox and follow the steps to choose a new password."
                : "Enter the code on the next screen to verify it's really you."}
            </p>
          </div>

          <Button
            type="button"
            onClick={() => router.push(nextHref)}
            className="h-11 w-full rounded-xl bg-[#0E3B2E] text-sm font-semibold text-white hover:bg-[#0A2E24]"
          >
            {emailOnly ? "Continue to new password" : "Enter verification code"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle={
        emailOnly
          ? "Enter the email on your account and we'll send a reset link."
          : "Enter the email or phone number on your account and we'll send a code."
      }
      backHref="/signin"
      backLabel="Back to sign in"
      footer={
        <>
          Remembered it?{" "}
          <Link href="/signin" className="font-semibold text-brand-teal hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="email" className={authLabelClass}>
            {emailOnly ? "Email address" : "Email or phone number"}
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/35" />
            <Input
              id="email"
              type={emailOnly ? "email" : "text"}
              placeholder={emailOnly ? "you@example.com" : "Email or phone number"}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError("")
              }}
              autoComplete="email"
              required
              aria-invalid={Boolean(error)}
              className={`${authFieldClass} pl-10 ${error ? "border-red-600/50" : ""}`}
            />
          </div>
          {error && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={!isFormFilled || isSending}
          className="h-11 w-full rounded-xl bg-[#0E3B2E] text-sm font-semibold text-white hover:bg-[#0A2E24] disabled:bg-brand-ink/20 disabled:text-brand-ink/35"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Send {emailOnly ? "reset link" : "verification code"}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-center text-[11px] leading-relaxed text-brand-ink/40">
          For your security, reset links expire shortly after they&apos;re sent.
        </p>
      </form>
    </AuthShell>
  )
}
