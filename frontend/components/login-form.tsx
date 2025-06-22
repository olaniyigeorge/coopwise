"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/use-toast"
import useAuthStore from "@/lib/stores/auth-store"

export default function LoginForm() {
  const router = useRouter()
  // const { login } = useAuth()
  const { login } = useAuthStore()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      await login({ username, password })
      
      // Check for returnUrl or pending invite
      const searchParams = new URLSearchParams(window.location.search)
      const returnUrl = searchParams.get('returnUrl')
      const pendingInvite = localStorage.getItem('pendingInviteCode')
      const pendingGroupName = localStorage.getItem('pendingGroupName')
      
      // If this login is for a group invite, show a toast notification
      if (returnUrl?.includes('/invite/') || pendingInvite) {
        toast({
          title: "Login successful!",
          description: pendingGroupName 
            ? `You'll now be redirected to join ${pendingGroupName}`
            : "You'll now be redirected to the invite page",
          variant: "default",
          className: "bg-green-50 border-green-200",
          duration: 3000,
        });
      }
      
      if (returnUrl && returnUrl.includes('/invite/')) {
        // If there's a returnUrl to an invite page, redirect there
        router.push(returnUrl)
      } else if (pendingInvite) {
        // If there's a pending invite, redirect to the invite page
        router.push(`/invite/${pendingInvite}`)
      } else {
        // Otherwise, the auth context will handle redirection
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      
      // Extract error message
      let errorMessage = 'Failed to login. Please check your credentials.'
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error
        }
      }
      
      setError(errorMessage)
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isFormFilled = username.trim() !== "" && password.trim() !== ""

  return (
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
        <h2 className="text-xl font-semibold text-center text-primary">Welcome Back</h2>
        <p className="text-sm text-center text-secondary mt-1">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-1">
          <Label htmlFor="username" className="text-sm font-medium text-gray-700">Email</Label>
          <Input
            id="username"
            type="text"
            placeholder="Enter your email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full h-10 border border-gray-300 rounded"
            disabled={loading}
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
              disabled={loading}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              tabIndex={-1}
              disabled={loading}
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
              disabled={loading}
            />
            <label
              htmlFor="remember"
              className="text-sm font-medium text-secondary"
            >
              Remember me
            </label>
          </div>
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/90">
            Forgot Password?
          </Link>
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
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
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
