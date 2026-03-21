"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, CheckCircle } from "lucide-react"

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
      window.location.href = "/login"
    }, 2000)
  }

  const isFormFilled = password.trim() !== "" && confirmPassword.trim() !== ""

  if (success) {
    return (
      <div className="p-8 w-full">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-center text-gray-900">Password Reset Successful</h2>
          <p className="text-sm text-center text-gray-600 mt-2">
            Your password has been reset successfully.
            <br />Redirecting to login page...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 w-full">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-center text-gray-900">Create New Password</h2>
        <p className="text-sm text-center text-gray-600 mt-2">
          Set a strong password to secure your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError("")
              }}
              required
              className={`w-full ${error && !validatePassword(password) ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'} pr-10`}
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
          <div className="text-xs text-gray-500 mt-1">
            <p>Password must be at least 8 characters, with one capital letter and one lowercase letter.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setError("")
              }}
              required
              className={`w-full ${error && (password !== confirmPassword) ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'} pr-10`}
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

        {error && <p className="text-xs text-red-500">{error}</p>}

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