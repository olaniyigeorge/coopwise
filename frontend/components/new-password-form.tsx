"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"

export default function NewPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const validatePassword = (pass: string) => {
    // Password must be at least 8 characters with capital and lowercase letters
    const hasMinLength = pass.length >= 8
    const hasUppercase = /[A-Z]/.test(pass)
    const hasLowercase = /[a-z]/.test(pass)
    
    return hasMinLength && hasUppercase && hasLowercase
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate password format
    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters, with one capital letter and one lowercase letter")
      return
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    // Handle password reset logic here
    console.log({ password, confirmPassword })
    
    // Show success message
    setSuccess(true)
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      window.location.href = "/auth/login"
    }, 2000)
  }

  const isFormFilled = password.trim() !== "" && confirmPassword.trim() !== ""

  if (success) {
    return (
      <div className="bg-white rounded-lg p-6 max-w-screen-sm w-full mx-auto">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-center text-primary">Password Reset Successful</h2>
          <p className="text-sm text-center text-secondary mt-1">
            Your password has been reset successfully.
            <br />Redirecting to login page...
          </p>
        </div>
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
        <h2 className="text-xl font-semibold text-center text-primary">New Password</h2>
        <p className="text-sm text-center text-secondary mt-1">
          Create a new password to get back into your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a new password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError("")
              }}
              required
              className={`w-full h-10 border ${error && !validatePassword(password) ? 'border-red-500' : 'border-gray-300'} rounded pr-10`}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1 max-w-full">
            <p className="leading-normal md:leading-relaxed">
              Password must be at least 8 characters, with one capital letter and one lowercase letter.
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter the new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setError("")
              }}
              required
              className={`w-full h-10 border ${error && (password !== confirmPassword) ? 'border-red-500' : 'border-gray-300'} rounded pr-10`}
            />
            <button 
              type="button" 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              tabIndex={-1}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

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
    </div>
  )
} 