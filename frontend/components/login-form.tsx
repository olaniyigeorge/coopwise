"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff } from "lucide-react"

export default function LoginForm() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormFilled) return
    
    try {
      setIsLoading(true)
      
      // Show loading toast
      toast.info('Signing in...', {
        description: 'Please wait while we verify your credentials.'
      })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real app, you would validate credentials with your API
      // For demo purposes, we'll accept any non-empty credentials
      if (phone.trim() && password.trim()) {
        // Store authentication data (in a real app, you'd get this from the API)
        // localStorage.setItem('authToken', 'demo-token')
        // localStorage.setItem('user', JSON.stringify({ phone, name: 'Mercy Oyelenmu' }))
        
        toast.success('Login successful!', {
          description: 'Welcome back to CoopWise.'
        })
        
        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        throw new Error('Invalid credentials')
      }
      
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed', {
        description: 'Please check your credentials and try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isFormFilled = phone.trim() !== "" && password.trim() !== ""

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
        <h2 className="text-xl font-semibold text-center text-primary">Welcome Back</h2>
        <p className="text-sm text-center text-secondary mt-1">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number/Email</Label>
          <Input
            id="phone"
            type="text"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full h-10 border border-gray-300 rounded"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
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
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember" 
              checked={rememberMe} 
              onCheckedChange={(checked) => setRememberMe(checked as boolean)} 
              className="h-4 w-4"
            />
            <label
              htmlFor="remember"
              className="text-sm font-medium text-secondary"
            >
              Remember me
            </label>
          </div>
          <Link href="/auth/forgot-password" className="text-sm font-medium text-primary hover:text-primary/90">
            Forgot Password?
          </Link>
        </div>

        <Button 
          type="submit" 
          disabled={!isFormFilled || isLoading}
          className={`w-full h-10 font-medium rounded mt-2 ${
            isFormFilled && !isLoading
            ? "bg-primary hover:bg-primary/90 text-white" 
            : "bg-gray-200 text-gray-700"
          }`}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center mt-4">
        <p className="text-sm text-secondary">
         Don't have an account? <Link href="/auth/signup" className="text-primary hover:text-primary/90 font-medium">Sign Up</Link>
        </p>
      </div>
    </div>
  )
}
