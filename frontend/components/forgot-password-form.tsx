"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { CheckCircle } from "lucide-react"

interface ForgotPasswordFormProps {
  emailOnly?: boolean;
}

export default function ForgotPasswordForm({ emailOnly = false }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isCodeSent, setIsCodeSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simple validation
    if (!email.trim()) {
      setError(`Please enter your ${emailOnly ? 'email address' : 'phone number or email'}`)
      return
    }
    
    // Email validation if emailOnly is true
    if (emailOnly && !email.includes('@')) {
      setError("Please enter a valid email address")
      return
    }
    
    // Simulate code sending process
    setIsCodeSent(true)
    
    // Handle forgot password logic here
    console.log({ email })
  }

  const isFormFilled = email.trim() !== ""

  if (isCodeSent) {
    return (
      <div className="p-8 w-full">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-center text-gray-900">Password Reset Link Sent</h2>
          <p className="text-sm text-center text-gray-600 mt-2">
            A password reset link has been sent to <strong>{email}</strong>
            <br />Check your inbox and follow the instructions to reset your password
          </p>
        </div>

        <Button 
          type="button" 
          onClick={() => window.location.href = emailOnly ? "/reset-password" : "/reset-password-code"}
          className="w-full"
        >
          Continue
        </Button>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Didn't receive the email? <button onClick={() => setIsCodeSent(false)} className="text-primary hover:text-primary/90 font-medium">Try again</button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 w-full">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-center text-gray-900">Reset Your Password</h2>
        <p className="text-sm text-center text-gray-600 mt-2">
          {emailOnly 
            ? "Enter your email address to receive a password reset link." 
            : "Enter the email address or phone number associated with your account."}
          <br />
          {emailOnly 
            ? "We'll send you a link to create a new password." 
            : "We'll send you a link to reset your password."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            {emailOnly ? "Email Address" : "Email or Phone Number"}
          </Label>
          <div className="relative">
            <Input
              id="email"
              type={emailOnly ? "email" : "text"}
              placeholder={emailOnly ? "Enter your email address" : "Enter your email or phone number"}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError("")
              }}
              required
              className={`w-full ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
            />
            {error && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 0C3.584 0 0 3.584 0 8C0 12.416 3.584 16 8 16C12.416 16 16 12.416 16 8C16 3.584 12.416 0 8 0ZM8.8 12H7.2V10.4H8.8V12ZM8.8 8.8H7.2V4H8.8V8.8Z" fill="#E11D48"/>
                </svg>
              </div>
            )}
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <Button 
          type="submit" 
          disabled={!isFormFilled}
          className="w-full"
        >
          Reset Password
        </Button>
      </form>

      <div className="text-center mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Remember your password? <Link href="/login" className="text-primary hover:text-primary/90 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
} 