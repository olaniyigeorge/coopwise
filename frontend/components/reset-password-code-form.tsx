"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function ResetPasswordCodeForm() {
  const [code, setCode] = useState<string[]>(Array(5).fill(''))
  const [error, setError] = useState("")
  const [timer, setTimer] = useState(119) // 1:59 in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Handle timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  // Format time to MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) {
      // If pasting multiple digits, distribute them across boxes
      const digits = value.split('').slice(0, 5 - index)
      const newCode = [...code]
      
      digits.forEach((digit, i) => {
        if (index + i < 5) {
          newCode[index + i] = digit
        }
      })
      
      setCode(newCode)
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(index + digits.length, 4)
      inputRefs.current[nextIndex]?.focus()
    } else {
      // Handle single digit input
      const newCode = [...code]
      newCode[index] = value
      setCode(newCode)
      
      // Move focus to next input if current one is filled
      if (value && index < 4) {
        inputRefs.current[index + 1]?.focus()
      }
    }

    setError("")
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace - move to previous input if current is empty
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const completeCode = code.join('')
    
    // Simple validation
    if (completeCode.length !== 5) {
      setError("Please enter the complete 5-digit verification code")
      return
    }
    
    // Handle code verification logic here
    console.log({ code: completeCode })
    
    // After verification, proceed to new password creation page
    window.location.href = "/auth/reset-password"
  }

  const resendCode = () => {
    // Reset timer
    setTimer(119)
    
    // Logic to resend code would go here
    console.log("Resending code")
  }

  return (
    <div className="bg-white rounded-lg p-6 max-w-screen-sm w-full mx-auto">
      <div className="mb-6">
        <div className="flex justify-start">
          <Link href="/auth/forgot-password" className="inline-block mb-4">
            <button className="text-sm text-secondary flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Home
            </button>
          </Link>
        </div>
        <h2 className="text-xl font-semibold text-center text-primary">Enter Verification Code</h2>
        <p className="text-sm text-center text-secondary mt-1">
          Please enter the 5-digit code sent to your email or<br />phone number.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center gap-3 my-6" role="group" aria-labelledby="verification-code-label">
          <span id="verification-code-label" className="sr-only">Verification Code</span>
          {[0, 1, 2, 3, 4].map((index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={code[index]}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-xl border border-gray-300 rounded focus:border-primary focus:outline-none"
              required
              aria-label={`Digit ${index + 1} of verification code`}
            />
          ))}
        </div>
        
        {error && <p className="text-xs text-red-500 text-center mt-1">{error}</p>}

        <Button 
          type="submit" 
          disabled={code.join('').length !== 5}
          className={`w-full h-10 font-medium rounded mt-2 ${
            code.join('').length === 5 
            ? "bg-primary hover:bg-primary/90 text-white" 
            : "bg-gray-200 text-gray-700"
          }`}
        >
          Verify
        </Button>
      </form>

      <div className="text-center mt-4">
        <p className="text-sm text-secondary">
          Didn't receive code? <button onClick={resendCode} className="text-primary hover:text-primary/90 font-medium">Resend code</button> {timer > 0 && formatTime(timer)}
        </p>
      </div>
    </div>
  )
} 