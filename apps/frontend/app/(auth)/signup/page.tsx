"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { Loader2, Lock, Mail, Phone, ArrowLeft } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form"
import { auth, getFirebaseErrorMessage } from "@/app/helpers/firebase"
import {
  signUpDetailsSchema,
  signUpDetailsFormValues,
  otpCodeSchema,
  otpCodeFormValues,
} from "@/app/helpers/validators/auth.schemas"
import useAuthStore from "@/stores/auth-store"
import { requestOtp, signInWithFirebase, verifyOtpAndRegister } from "@/services/auth-service"


type IdentifierMode = "email" | "phone"
type Step = "details" | "otp"

const SignUpPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get("from") ?? "/onboarding"
  const setUser = useAuthStore((s) => s.setUser)

  const [mode, setMode] = useState<IdentifierMode>("email")
  const [step, setStep] = useState<Step>("details")
  const [rootError, setRootError] = useState<string | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const detailsForm = useForm<signUpDetailsFormValues>({
    resolver: zodResolver(signUpDetailsSchema),
    defaultValues: { identifier: "", full_name: "", password: "" },
  })

  const otpForm = useForm<otpCodeFormValues>({
    resolver: zodResolver(otpCodeSchema),
    defaultValues: { code: "" },
  })

  const handleDetailsSubmit = async (values: signUpDetailsFormValues) => {
    setRootError(null)
    try {
      await requestOtp(mode, values.identifier)
      setStep("otp")
    } catch (error: any) {
      setRootError(error?.detail ?? "Couldn't send the code. Try again.")
    }
  }

  const handleOtpSubmit = async (values: otpCodeFormValues) => {
    setRootError(null)
    const details = detailsForm.getValues()
    try {
      const { is_new_user, user } = await verifyOtpAndRegister({
        channel: mode,
        identifier: details.identifier,
        code: values.code,
        full_name: details.full_name,
        password: details.password,
      })
      setUser(user)
      router.push(is_new_user ? "/onboarding" : from)
    } catch (error: any) {
      setRootError(error?.detail ?? "That code didn't work. Try again.")
    }
  }

  const handleGoogleSignUp = async () => {
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
    <div className="auth_bg relative min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-brand-paper rounded-2xl border border-brand-gold/20 shadow-xl p-8 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-brand-gold/10 border border-brand-gold flex items-center justify-center">
            <Lock className="w-5 h-5 text-brand-gold" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="font-display text-xl text-brand-ink">
              {step === "details" ? "Create your account" : "Check your inbox"}
            </h1>
            <p className="text-sm text-brand-secondary">
              {step === "details"
                ? "Start saving with your cooperative"
                : `We sent a code to your ${mode}`}
            </p>
          </div>
        </div>

        {step === "details" && (
          <>
            <div className="flex text-sm">
              {(["email", "phone"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m)
                    detailsForm.setValue("identifier", "")
                    detailsForm.clearErrors("identifier")
                  }}
                  className={`flex-1 py-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors touch-manipulation
                    ${mode === m
                      ? "border-brand-teal text-brand-teal font-medium"
                      : "border-brand-gold/20 text-brand-secondary"
                    }`}
                >
                  {m === "email" ? <Mail className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                  {m === "email" ? "Email" : "Phone"}
                </button>
              ))}
            </div>

            <Form {...detailsForm}>
              <form onSubmit={detailsForm.handleSubmit(handleDetailsSubmit)} className="space-y-4">
                <FormField
                  control={detailsForm.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Full name" autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={detailsForm.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type={mode === "email" ? "email" : "tel"}
                          placeholder={mode === "email" ? "you@example.com" : "+234 800 000 0000"}
                          autoComplete={mode === "email" ? "email" : "tel"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={detailsForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="password" placeholder="Password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {rootError && <p className="text-sm text-red-500">{rootError}</p>}

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-brand-teal hover:bg-brand-teal/90"
                  disabled={detailsForm.formState.isSubmitting}
                >
                  {detailsForm.formState.isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Send code"
                  )}
                </Button>
              </form>
            </Form>

            <div className="flex items-center gap-3 text-xs text-brand-secondary">
              <div className="h-px flex-1 tally-divider" />
              or
              <div className="h-px flex-1 tally-divider" />
            </div>

            <button
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading}
              className={`w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 touch-manipulation
                ${isGoogleLoading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white border border-brand-gold/20 hover:bg-brand-paper text-brand-ink shadow-sm active:scale-[0.99]"
                }`}
            >
              {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.85z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.85C6.71 7.3 9.14 5.38 12 5.38z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </>
        )}

        {step === "otp" && (
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
              <FormField
                control={otpForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="6-digit code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {rootError && <p className="text-sm text-red-500">{rootError}</p>}

              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-brand-teal hover:bg-brand-teal/90"
                disabled={otpForm.formState.isSubmitting}
              >
                {otpForm.formState.isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Verify and create account"
                )}
              </Button>

              <button
                type="button"
                onClick={() => setStep("details")}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-brand-secondary py-1 touch-manipulation"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            </form>
          </Form>
        )}

        <div className="text-center text-sm text-brand-secondary">
          Already have an account?{" "}
          <Link href="/signin" className="text-brand-teal font-medium">
            Sign in
          </Link>
        </div>
        <div className="text-center">
          <Link href="/" className="text-xs text-brand-secondary underline underline-offset-2">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage