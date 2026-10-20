"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form"
import { AuthDivider, AuthShell, authFieldClass } from "@/components/auth/auth-shell"
import { auth, getFirebaseErrorMessage } from "@/helpers/firebase"
import { passwordSignInSchema, passwordSignInFormValues } from "@/helpers/validators/auth.schemas"
import useAuthStore from "@/stores/auth-store"
import { signInWithFirebase, signInWithPassword } from "@/services/auth-service"

type IdentifierMode = "email" | "phone"

// Phone auth (SMS OTP) isn't wired up yet — no SMS provider configured.
// Email is fully live now that Resend is set up. Flip this when SMS lands.
const isPhoneAuthEnabled = false

const SignInPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get("from") ?? "/dashboard"
  const setUser = useAuthStore((s) => s.setUser)

  const [mode, setMode] = useState<IdentifierMode>("email")
  const [rootError, setRootError] = useState<string | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPhoneDisabledNotice, setShowPhoneDisabledNotice] = useState(false)

  const form = useForm<passwordSignInFormValues>({
    resolver: zodResolver(passwordSignInSchema),
    defaultValues: { identifier: "", password: "" },
  })

  const onSubmit = async (values: passwordSignInFormValues) => {
    setRootError(null)
    try {
      const { is_new_user, user } = await signInWithPassword(values.identifier, values.password)
      setUser(user)
      router.push(is_new_user ? "/onboarding" : from)
    } catch (error: any) {
      setRootError(error?.detail ?? "Something went wrong signing you in.")
    }
  }

  const handleGoogleSignIn = async () => {
    setRootError(null)
    setIsGoogleLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const { is_new_user, user } = await signInWithFirebase(result.user)
      setUser(user)
      router.push(is_new_user ? "/onboarding" : from)
    } catch (error: any) {
      setRootError(getFirebaseErrorMessage(error.code))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to CoopWise"
      subtitle="Pick up where your cooperative left off."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-brand-teal hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        {/* Email / phone selector */}
        <div className="grid grid-cols-2 gap-1 rounded-full border border-brand-ink/10 bg-brand-ink/[0.035] p-1">
          {(["email", "phone"] as const).map((m) => {
            const disabled = m === "phone" && !isPhoneAuthEnabled
            const active = mode === m
            return (
              <button
                key={m}
                type="button"
                tabIndex={disabled ? -1 : 0}
                aria-pressed={active}
                onClick={() => {
                  if (disabled) {
                    setShowPhoneDisabledNotice(true)
                    return
                  }
                  setMode(m)
                  setShowPhoneDisabledNotice(false)
                  form.setValue("identifier", "")
                  form.clearErrors("identifier")
                }}
                className={`flex min-h-0 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-white text-brand-ink shadow-sm"
                    : "text-brand-ink/45 hover:text-brand-ink/70"
                } ${disabled ? "cursor-not-allowed opacity-45" : ""}`}
              >
                {m === "email" ? <Mail className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
                {m === "email" ? "Email" : "Phone"}
              </button>
            )
          })}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/35">
                        {mode === "email" ? (
                          <Mail className="h-4 w-4" />
                        ) : (
                          <Phone className="h-4 w-4" />
                        )}
                      </span>
                      <Input
                        type={mode === "email" ? "email" : "tel"}
                        placeholder={mode === "email" ? "you@example.com" : "+234 800 000 0000"}
                        autoComplete={mode === "email" ? "email" : "tel"}
                        className={`${authFieldClass} pl-10`}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-ink/50">
                      Password
                    </span>
                    <Link
                      href="/forgot-password"
                      className="text-[11px] font-semibold text-brand-teal hover:underline"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/35">
                        <Lock className="h-4 w-4" />
                      </span>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className={`${authFieldClass} pl-10 pr-11`}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-2 top-1/2 flex h-8 w-8 min-h-0 min-w-0 -translate-y-1/2 items-center justify-center rounded-full text-brand-ink/40 transition-colors hover:bg-brand-ink/[0.05] hover:text-brand-ink/70"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {rootError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-600/20 bg-red-600/[0.06] px-3 py-2.5 text-xs leading-relaxed text-red-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{rootError}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="h-11 w-full rounded-xl bg-[#0E3B2E] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0A2E24]"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </Form>

        {showPhoneDisabledNotice && (
          <p className="rounded-xl border border-brand-gold/20 bg-brand-gold/10 px-3 py-2 text-center text-xs leading-relaxed text-brand-ink/60">
            Phone sign-in isn&apos;t available yet. Continue with email or Google.
          </p>
        )}

        <AuthDivider />

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className={`flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 touch-manipulation ${
            isGoogleLoading
              ? "cursor-not-allowed border-brand-ink/10 bg-brand-ink/[0.03] text-brand-ink/35"
              : "border-brand-ink/15 bg-white text-brand-ink shadow-sm hover:border-brand-teal/40 hover:bg-white active:scale-[0.99]"
          }`}
        >
          {isGoogleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.85z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.85C6.71 7.3 9.14 5.38 12 5.38z" />
              </svg>
              Continue with Google
            </>
          )}
        </button>
      </div>
    </AuthShell>
  )
}

export default SignInPage
