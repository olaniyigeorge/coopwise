"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"

export default function ForgotPasswordForm() {
  const [phoneOrEmail, setPhoneOrEmail] = useState("")
  const [error, setError] = useState("")
  const [isCodeSent, setIsCodeSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simple validation
    if (!phoneOrEmail.trim()) {
      setError("Please enter your phone number or email")
      return
    }
    
    // Simulate code sending process
    setIsCodeSent(true)
    
    // Handle forgot password logic here
    console.log({ phoneOrEmail })
  }

  const isFormFilled = phoneOrEmail.trim() !== ""

  if (isCodeSent) {
    return (
      <div className="bg-white rounded-lg p-6 max-w-screen-sm w-full mx-auto">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <Image src="/assets/icons/Check.svg" alt="Success" width={24} height={24} />
          </div>
          <h2 className="text-xl font-semibold text-center text-primary">Password Reset Code Sent</h2>
          <p className="text-sm text-center text-secondary mt-1">
            Reset password link has been sent to xxxxx
            <br />Enter code to reset your password
          </p>
        </div>

        <Button 
          type="button" 
          onClick={() => window.location.href = "/auth/reset-password-code"}
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded h-10"
        >
          Proceed
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 max-w-screen-sm w-full mx-auto">
      <div className="mb-6">
        <div className="flex justify-start">
          <Link href="/" className="inline-block mb-4">
            <button className="text-sm text-secondary flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Home
            </button>
          </Link>
        </div>
        <h2 className="text-xl font-semibold text-center text-primary">Forgot Password</h2>
        <p className="text-sm text-center text-secondary mt-1">
          Enter the phone number or email you signed up with.
          <br />We will send a code to reset your password
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="phoneOrEmail" className="text-sm font-medium text-gray-700">Phone Number/Email</Label>
          <div className="relative">
            <Input
              id="phoneOrEmail"
              type="text"
              placeholder="Enter your phone number"
              value={phoneOrEmail}
              onChange={(e) => {
                setPhoneOrEmail(e.target.value)
                setError("")
              }}
              required
              className={`w-full h-10 border ${error ? 'border-red-500' : 'border-gray-300'} rounded`}
            />
            {error && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 0C3.584 0 0 3.584 0 8C0 12.416 3.584 16 8 16C12.416 16 16 12.416 16 8C16 3.584 12.416 0 8 0ZM8.8 12H7.2V10.4H8.8V12ZM8.8 8.8H7.2V4H8.8V8.8Z" fill="#E11D48"/>
                </svg>
              </div>
            )}
          </div>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          {error && <p className="text-xs text-red-500">Phone number/Email</p>}
        </div>

        <Button 
          type="submit" 
          disabled={!isFormFilled}
          className={`w-full h-10 font-medium rounded mt-2 ${
            isFormFilled 
            ? "bg-primary hover:bg-primary/90 text-white" 
            : "bg-gray-200 text-gray-700"
          }`}
        >
          Proceed
        </Button>
      </form>

      <div className="text-center mt-4">
        <p className="text-sm text-secondary">
          Remember Password? <Link href="/auth/login" className="text-primary hover:text-primary/90 font-medium">Sign in here</Link>
        </p>
      </div>
    </div>
  )
} 