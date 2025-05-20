"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"

export default function SignupForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle signup logic here
    console.log({ fullName, phone, email, password })
    
    // Redirect to profile page after signup
    router.push('/auth/profile')
  }

  const isFormFilled = fullName.trim() !== "" && 
                       phone.trim() !== "" && 
                       password.trim() !== ""

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-screen-sm w-full mx-auto">
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
        <h2 className="text-xl font-semibold text-center text-primary">Create Account</h2>
        <p className="text-sm text-center text-secondary mt-1">Join CoopWise to start saving smarter</p>
      </div>

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

        <div className="space-y-1">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full h-10 border border-gray-300 rounded"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 border border-gray-300 rounded"
          />
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
            Password must be at least 8 characters, with one capital letter and one lowercase letter.
          </p>
        </div>

        <div className="text-xs text-gray-600 mt-2">
          By signing up, you agree to the <Link href="/terms" className="text-primary hover:underline">Terms and Condition</Link>
        </div>

        <Button 
          type="submit" 
          disabled={!isFormFilled}
          className={`w-full h-10 font-medium rounded mt-2 ${
            isFormFilled 
            ? "bg-primary hover:bg-primary/90 text-white" 
            : "bg-gray-200 text-gray-500"
          }`}
        >
          Sign Up
        </Button>
      </form>

      <div className="text-center mt-4">
        <p className="text-sm text-secondary">
          Already have an account? <Link href="/auth/login" className="text-primary hover:text-primary/90 font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
