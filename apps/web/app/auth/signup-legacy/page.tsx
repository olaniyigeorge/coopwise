"use client"

/**
 * Legacy signup page — preserved but disconnected from the main flow.
 * Main signup is now at /auth/signup (Crossmint-based).
 * This page is accessible at /auth/signup-legacy for reference / fallback.
 */

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function LegacySignupPage() {
  const router = useRouter()
  const { register, error, loading, clearError } = useAuth()
  
  const countryCodes = [
    { code: "+213", country: "Algeria", flag: "🇩🇿" },
    { code: "+20", country: "Egypt", flag: "🇪🇬" },
    { code: "+234", country: "Nigeria", flag: "🇳🇬" },
    { code: "+27", country: "South Africa", flag: "🇿🇦" },
    { code: "+254", country: "Kenya", flag: "🇰🇪" },
    { code: "+233", country: "Ghana", flag: "🇬🇭" },
    { code: "+255", country: "Tanzania", flag: "🇹🇿" },
    { code: "+256", country: "Uganda", flag: "🇺🇬" },
    { code: "+212", country: "Morocco", flag: "🇲🇦" },
    { code: "+263", country: "Zimbabwe", flag: "🇿🇼" },
    { code: "+249", country: "Sudan", flag: "🇸🇩" },
    { code: "+251", country: "Ethiopia", flag: "🇪🇹" },
    { code: "+225", country: "Ivory Coast", flag: "🇨🇮" },
    { code: "+237", country: "Cameroon", flag: "🇨🇲" },
    { code: "+250", country: "Rwanda", flag: "🇷🇼" },
    { code: "+221", country: "Senegal", flag: "🇸🇳" },
  ]
  
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [selectedCountryCode, setSelectedCountryCode] = useState("+234")
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false)
        setSearchQuery("")
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredCountries = countryCodes.filter(country =>
    country.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.includes(searchQuery)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLocalError(null)
    
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters")
      return
    }
    
    const formattedPhone = selectedCountryCode + phone.replace(/\D/g, '')
    if (!/^\+\d{7,15}$/.test(formattedPhone)) {
      setLocalError("Phone number must be valid (e.g. 8012345678)")
      return
    }
    
    try {
      await register({
        full_name: fullName,
        phone_number: formattedPhone,
        email: email,
        password: password,
        username: email,
        role: "user"
      })
      toast({ title: "Account created!", description: "Your account has been created successfully." })
      router.push('/auth/profile-setup')
    } catch (err) {
      console.error("Registration error:", err)
    }
  }

  const isFormFilled = fullName.trim() !== "" && phone.trim() !== "" && email.trim() !== "" && password.trim() !== ""

  return (
    <div className="min-h-screen auth_bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full">
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            You are using the legacy signup. <Link href="/auth/signup" className="underline font-medium">Switch to the new experience →</Link>
          </div>
          <div className="mb-6">
            <Link href="/" className="inline-block mb-4">
              <button className="text-sm text-secondary flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back
              </button>
            </Link>
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
              <Input id="fullName" type="text" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full h-10 border border-gray-300 rounded" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full h-10 border border-gray-300 rounded" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
              <div className="flex" ref={dropdownRef}>
                <div className="relative">
                  <button type="button" onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="flex items-center justify-between w-28 h-10 px-3 border border-gray-300 border-r-0 rounded-l bg-white hover:bg-gray-50">
                    <span className="text-lg mr-1">{countryCodes.find(c => c.code === selectedCountryCode)?.flag || "🇳🇬"}</span>
                    <span className="text-sm font-medium">{selectedCountryCode}</span>
                  </button>
                  {showCountryDropdown && (
                    <div className="absolute z-50 w-56 max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
                      <div className="p-2 border-b"><Input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-7 text-sm" /></div>
                      {filteredCountries.map((country) => (
                        <button key={country.code} type="button" onClick={() => { setSelectedCountryCode(country.code); setShowCountryDropdown(false); setSearchQuery("") }}
                          className="flex items-center w-full px-3 py-2 hover:bg-gray-100 text-left">
                          <span className="text-lg mr-2">{country.flag}</span>
                          <span className="text-sm">{country.code} {country.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Input id="phone" type="tel" placeholder="8012345678" value={phone} onChange={(e) => setPhone(e.target.value)} required className="flex-1 h-10 border border-gray-300 rounded-r" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full h-10 border border-gray-300 rounded pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={!isFormFilled || loading} className={`w-full h-10 font-medium rounded mt-2 ${isFormFilled && !loading ? "bg-primary hover:bg-primary/90 text-white" : "bg-gray-200 text-gray-500"}`}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account...</> : "Sign Up"}
            </Button>
          </form>
          <div className="text-center mt-4">
            <p className="text-sm text-secondary">Already have an account? <Link href="/auth/login" className="text-primary font-medium">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
