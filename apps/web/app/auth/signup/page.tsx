"use client"

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

export default function SignupPage() {
  const router = useRouter()
  const { register, error, loading, clearError } = useAuth()
  
  // African country calling codes
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
    { code: "+236", country: "Central African Republic", flag: "🇨🇫" },
    { code: "+235", country: "Chad", flag: "🇹🇩" },
    { code: "+242", country: "Congo", flag: "🇨🇬" },
    { code: "+243", country: "DR Congo", flag: "🇨🇩" },
    { code: "+241", country: "Gabon", flag: "🇬🇦" },
    { code: "+224", country: "Guinea", flag: "🇬🇳" },
    { code: "+245", country: "Guinea-Bissau", flag: "🇬🇼" },
    { code: "+231", country: "Liberia", flag: "🇱🇷" },
    { code: "+223", country: "Mali", flag: "🇲🇱" },
    { code: "+222", country: "Mauritania", flag: "🇲🇷" },
    { code: "+227", country: "Niger", flag: "🇳🇪" },
    { code: "+221", country: "Senegal", flag: "🇸🇳" },
    { code: "+232", country: "Sierra Leone", flag: "🇸🇱" },
    { code: "+228", country: "Togo", flag: "🇹🇬" },
    { code: "+216", country: "Tunisia", flag: "🇹🇳" },
    { code: "+260", country: "Zambia", flag: "🇿🇲" },
    { code: "+267", country: "Botswana", flag: "🇧🇼" },
    { code: "+266", country: "Lesotho", flag: "🇱🇸" },
    { code: "+268", country: "Eswatini", flag: "🇸🇿" },
    { code: "+250", country: "Rwanda", flag: "🇷🇼" },
    { code: "+257", country: "Burundi", flag: "🇧🇮" },
    { code: "+252", country: "Somalia", flag: "🇸🇴" },
    { code: "+253", country: "Djibouti", flag: "🇩🇯" },
    { code: "+248", country: "Seychelles", flag: "🇸🇨" },
    { code: "+230", country: "Mauritius", flag: "🇲🇺" },
    { code: "+261", country: "Madagascar", flag: "🇲🇬" },
    { code: "+269", country: "Comoros", flag: "🇰🇲" },
    { code: "+291", country: "Eritrea", flag: "🇪🇷" }
  ]
  
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [selectedCountryCode, setSelectedCountryCode] = useState("+234") // Default to Nigeria
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectedItemRef = useRef<HTMLButtonElement>(null)

  // Auto-detect user's country based on timezone
  useEffect(() => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (timezone.includes('Africa')) {
        // Map common timezones to country codes
        const timezoneToCountry: { [key: string]: string } = {
          'Africa/Lagos': '+234', // Nigeria
          'Africa/Cairo': '+20',  // Egypt
          'Africa/Johannesburg': '+27', // South Africa
          'Africa/Nairobi': '+254', // Kenya
          'Africa/Accra': '+233', // Ghana
          'Africa/Dar_es_Salaam': '+255', // Tanzania
          'Africa/Kampala': '+256', // Uganda
          'Africa/Casablanca': '+212', // Morocco
          'Africa/Harare': '+263', // Zimbabwe
          'Africa/Khartoum': '+249', // Sudan
        }
        
        const suggestedCode = timezoneToCountry[timezone]
        if (suggestedCode) {
          setSelectedCountryCode(suggestedCode)
        }
      }
    } catch (error) {
      // Fallback to default if timezone detection fails
      console.log('Could not detect timezone, using default country code')
    }
  }, [])

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false)
        setSearchQuery("")
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Filter countries based on search query
  const filteredCountries = countryCodes.filter(country =>
    country.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.includes(searchQuery)
  )

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current && showCountryDropdown) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [selectedIndex, showCountryDropdown])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showCountryDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredCountries.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCountries.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCountries[selectedIndex]) {
          setSelectedCountryCode(filteredCountries[selectedIndex].code)
          setShowCountryDropdown(false)
          setSearchQuery("")
          setSelectedIndex(0)
        }
        break
      case 'Escape':
        setShowCountryDropdown(false)
        setSearchQuery("")
        setSelectedIndex(0)
        break
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLocalError(null)
    
    // Basic validation
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters")
      return
    }
    
    // Validate phone number format using selected country code
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
        username: email, // Use email as username
        role: "user"
      })
      
      // Check for returnUrl or pending invite
      const searchParams = new URLSearchParams(window.location.search)
      const returnUrl = searchParams.get('returnUrl')
      const pendingInvite = localStorage.getItem('pendingInviteCode')
      const pendingGroupName = localStorage.getItem('pendingGroupName')
      
      // If this signup is for a group invite, show a toast notification
      if (returnUrl?.includes('/invite/') || pendingInvite) {
        // Success message for joining a group
        toast({
          title: "Account created successfully!",
          description: pendingGroupName 
            ? `You'll now be redirected to join ${pendingGroupName}`
            : "You'll now be redirected to complete the group join process",
          variant: "default",
          className: "bg-green-50 border-green-200",
          duration: 3000,
        });
      } else {
        // Regular success message
        toast({
          title: "Account created!",
          description: "Your account has been created successfully.",
          variant: "default",
          className: "bg-green-50 border-green-200",
        });
      }
      
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
          <div className="flex">
            {/* Country Code Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                className="flex items-center justify-between w-32 h-10 px-3 border border-gray-300 border-r-0 rounded-l bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                title={`${countryCodes.find(c => c.code === selectedCountryCode)?.country || 'Nigeria'} (${selectedCountryCode})`}
              >
                <span className="text-lg mr-1">
                  {countryCodes.find(c => c.code === selectedCountryCode)?.flag || "🇳🇬"}
                </span>
                <span className="text-sm font-medium">{selectedCountryCode}</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showCountryDropdown && (
                <div className="absolute z-50 w-64 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
                  {/* Search Input */}
                  <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                    <Input
                      type="text"
                      placeholder="Search countries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full h-8 text-sm"
                    />
                  </div>
                  
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        ref={selectedIndex === filteredCountries.findIndex(c => c.code === country.code) ? selectedItemRef : null}
                        onClick={() => {
                          setSelectedCountryCode(country.code)
                          setShowCountryDropdown(false)
                          setSearchQuery("")
                          setSelectedIndex(0)
                        }}
                        className={`flex items-center w-full px-3 py-2 text-left focus:outline-none ${
                          selectedIndex === filteredCountries.findIndex(c => c.code === country.code)
                            ? 'bg-primary text-white'
                            : 'hover:bg-gray-100 focus:bg-gray-100'
                        }`}
                      >
                        <span className="text-lg mr-2">{country.flag}</span>
                        <span className="text-sm font-medium">{country.code}</span>
                        <span className="text-sm text-gray-600 ml-2">{country.country}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-gray-500 text-sm">
                      No countries found
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Phone Number Input */}
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number (e.g. 8012345678)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="flex-1 h-10 border border-gray-300 rounded-r"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter your phone number without the country code
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
