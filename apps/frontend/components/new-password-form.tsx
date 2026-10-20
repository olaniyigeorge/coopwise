"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, Check, Loader2, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell, authFieldClass, authLabelClass } from "@/components/auth/auth-shell"

const REQUIREMENTS = [
  { key: "length", label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { key: "upper", label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { key: "lower", label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
] as const

export default function NewPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const meetsRequirements = REQUIREMENTS.every((r) => r.test(password))
  const passwordsMatch = password.length > 0 && password === confirmPassword
  const isFormFilled = password.trim() !== "" && confirmPassword.trim() !== ""

  useEffect(() => {
    if (!success) return
    const timeout = setTimeout(() => router.push("/signin"), 2200)
    return () => clearTimeout(timeout)
  }, [success, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!meetsRequirements) {
      setError("Your password must be at least 8 characters with one uppercase and one lowercase letter.")
      return
    }

    if (password !== confirmPassword) {
      setError("Those passwords don't match.")
      return
    }

    // Backend reset submission goes here.
    setSuccess(true)
  }

  if (success) {
    return (
      <AuthShell
        eyebrow="All set"
        title="Password updated"
        subtitle="Your new password is saved. Taking you back to sign in…"
        footer={
          <Link href="/signin" className="font-semibold text-brand-teal hover:underline">
            Go to sign in now
          </Link>
        }
      >
        <div className="flex flex-col items-center rounded-2xl border border-brand-gold/20 bg-brand-gold/[0.07] px-5 py-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-teal shadow-sm">
            <Check className="h-8 w-8" strokeWidth={2.2} />
          </span>
          <div className="mt-4 flex items-center gap-2 text-xs text-brand-ink/45">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Redirecting to sign in
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Choose a new password"
      subtitle="Make it something you'll remember — and hard for anyone else to guess."
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
          <Label htmlFor="password" className={authLabelClass}>
            New password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/35" />
            <Input
              id="password"
              type="password"
              placeholder="Enter a new password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError("")
              }}
              autoComplete="new-password"
              required
              className={`${authFieldClass} pl-10`}
            />
          </div>

          <ul className="mt-3 space-y-1.5">
            {REQUIREMENTS.map((requirement) => {
              const met = requirement.test(password)
              return (
                <li
                  key={requirement.key}
                  className={`flex items-center gap-2 text-[11px] transition-colors ${
                    met ? "text-brand-teal" : "text-brand-ink/40"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      met
                        ? "border-brand-teal bg-brand-teal text-white"
                        : "border-brand-ink/20"
                    }`}
                  >
                    {met && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                  </span>
                  {requirement.label}
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <Label htmlFor="confirmPassword" className={authLabelClass}>
            Confirm new password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/35" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setError("")
              }}
              autoComplete="new-password"
              required
              className={`${authFieldClass} pl-10 ${
                confirmPassword.length > 0 && !passwordsMatch ? "border-red-600/50" : ""
              }`}
            />
          </div>
          {passwordsMatch && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-brand-teal">
              <Check className="h-3.5 w-3.5" />
              Passwords match
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-600/20 bg-red-600/[0.06] px-3 py-2.5 text-xs leading-relaxed text-red-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={!isFormFilled || !meetsRequirements || !passwordsMatch}
          className="h-11 w-full rounded-xl bg-[#0E3B2E] text-sm font-semibold text-white hover:bg-[#0A2E24] disabled:bg-brand-ink/20 disabled:text-brand-ink/35"
        >
          Save new password
        </Button>
      </form>
    </AuthShell>
  )
}
