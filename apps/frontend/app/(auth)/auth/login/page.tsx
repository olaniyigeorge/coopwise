"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import { sendSignInLinkToEmail, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { Loader2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { auth, getFirebaseErrorMessage } from "@/app/helpers/firebase"
import { createSession } from "@/app/helpers/api/auth.api"
import { useFlowWallet } from "@/lib/crossmint/use-flow-wallet"
import { authFormValues, authSchema } from "@/app/helpers/validators/auth.schemas"

const googleProvider = new GoogleAuthProvider()

const AuthPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get("from") ?? "/dashboard"

  const { walletStatus } = useFlowWallet()

  const form = useForm<authFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = async (values: authFormValues) => {
    try {
      const actionCodeSettings = {
        // Domain must be in Firebase Console's authorized domains list.
        url: `${window.location.origin}/verify`,
        handleCodeInApp: true,
      }
      await sendSignInLinkToEmail(auth, values.email, actionCodeSettings)
      localStorage.setItem("emailForSignIn", values.email)
      router.push("/verify")
    } catch (error: any) {
      form.setError("root", { message: getFirebaseErrorMessage(error.code) })
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const { is_new_user } = await createSession(result.user)
      router.push(is_new_user ? "/onboarding" : from)
    } catch (error: any) {
      form.setError("root", { message: getFirebaseErrorMessage(error.code) })
    }
  }

  const isLoading =
    walletStatus === "authenticating" ||
    walletStatus === "provisioning-wallet" ||
    walletStatus === "syncing-backend"

  const statusMessages: Record<string, string> = {
    authenticating: "Opening secure sign-in...",
    "provisioning-wallet": "Loading your wallet...",
    "syncing-backend": "Signing you in...",
    ready: "Welcome back! Redirecting...",
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-6 overflow-hidden">
      <div className="w-full max-w-sm space-y-6">
        {/* Email link sign-in */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-sm text-red-500">{form.formState.errors.root.message}</p>
            )}
            <Button type="submit" className="w-full h-11 rounded-xl" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Continue with Email"
              )}
            </Button>
          </form>
        </Form>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Google SSO */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className={`w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-200
            ${isLoading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md active:scale-[0.99]"
            }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {statusMessages[walletStatus] ?? "Please wait..."}
            </>
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
      </div>
    </div>
  )
}

export default AuthPage