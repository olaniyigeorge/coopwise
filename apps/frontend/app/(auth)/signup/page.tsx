import { Suspense } from "react"
import SignUpForm from "@/components/auth/signup-form"

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  )
}