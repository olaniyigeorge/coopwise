"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const { register, error, loading, clearError } = useAuth()
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLocalError(null)
    
    // Basic validation
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters")
      return
    }
    
    // Validate phone number format (simple E.164 validation)
    let formattedPhone = phone
    if (!phone.startsWith('+')) {
      formattedPhone = '+' + phone
    }
    
    if (!/^\+\d{7,15}$/.test(formattedPhone)) {
      setLocalError("Phone number must be in international format (e.g. +2348012345678)")
      return
    }
    
    try {
      await register({
        full_name: fullName,
        phone_number: formattedPhone,
        email: email,
        password: password,
        username: username || email, // Use email as username if not provided
        role: "user"
      })
      
      // Check for returnUrl or pending invite
      const searchParams = new URLSearchParams(window.location.search)
      const returnUrl = searchParams.get('returnUrl')
      const pendingInvite = localStorage.getItem('pendingInviteCode')
      
      if (returnUrl && returnUrl.includes('/invite/')) {
        // If there's a returnUrl to an invite page, redirect there
        router.push(returnUrl)
      } else if (pendingInvite) {
        // If there's a pending invite, redirect to the invite page
        router.push(`/invite/${pendingInvite}`)
      } else {
        // Default redirect to profile setup
        router.push('/auth/profile-setup')
      }
    } catch (err) {
      // Error handling is done in the auth context
      console.error("Registration error:", err)
    }
  }

  const isFormFilled = fullName.trim() !== "" && 
                       phone.trim() !== "" && 
                       email.trim() !== "" &&
                       password.trim() !== ""

  return (
    <div className="min-h-screen auth_bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full">
      <div className="mb-6">
        <div className="flex justify-start">
          <Link href="/" className="inline-block mb-4">
            <button className="text-sm text-secondary flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </button>
          </Link>
        </div>
        <h2 className="text-xl font-semibold text-center text-primary">Create Account</h2>
        <p className="text-sm text-center text-secondary mt-1">Join CoopWise to start saving smarter</p>
      </div>

      {(error || localError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{localError || error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full h-10 border border-gray-300 rounded"
          />
        </div>

 {/*        <div className="space-y-1">
          <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full h-10 border border-gray-300 rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            Username is required and must be unique
          </p>
        </div> */}

        <div className="space-y-1">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-10 border border-gray-300 rounded"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Enter your phone number (e.g. +2348012345678)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full h-10 border border-gray-300 rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use international format (e.g., +2348012345678)
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-10 border border-gray-300 rounded pr-10"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Password must be at least 6 characters.
          </p>
        </div>

        <div className="text-xs text-gray-600 mt-2">
          By signing up, you agree to the <Link href="/terms" className="text-primary hover:underline">Terms and Condition</Link>
        </div>

        <Button 
          type="submit" 
          disabled={!isFormFilled || loading}
          className={`w-full h-10 font-medium rounded mt-2 ${
            isFormFilled && !loading
            ? "bg-primary hover:bg-primary/90 text-white" 
            : "bg-gray-200 text-gray-500"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Sign Up"
          )}
        </Button>
      </form>

      <div className="text-center mt-4">
        <p className="text-sm text-secondary">
          Already have an account? <Link href="/auth/login" className="text-primary hover:text-primary/90 font-medium">Sign In</Link>
        </p>
      </div>
        </div>
      </div>
    </div>
  )
}
