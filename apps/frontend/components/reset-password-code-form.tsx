"use client"

import { useState, useRef, useEffect } from "react"

import { Button } from "@/components/ui/button"

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
    window.location.href = "/reset-password"
  }

  const resendCode = () => {
    // Reset timer
    setTimer(119)
    
    // Logic to resend code would go here
    console.log("Resending code")
  }

  return (
    <div className="p-8 w-full">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-center text-gray-900">Enter Verification Code</h2>
        <p className="text-sm text-center text-gray-600 mt-2">
          Please enter the 5-digit code sent to your email
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-3 my-8" role="group" aria-labelledby="verification-code-label">
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
              className="w-12 h-14 text-center text-xl font-semibold border border-gray-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              required
              aria-label={`Digit ${index + 1} of verification code`}
            />
          ))}
        </div>
        
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <Button 
          type="submit" 
          disabled={code.join('').length !== 5}
          className="w-full"
        >
          Verify Code
        </Button>
      </form>

      <div className="text-center mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          {timer > 0 ? (
            <>
              Didn&apos;t receive code? You can resend in <span className="font-medium">{formatTime(timer)}</span>
            </>
          ) : (
            <>
              Didn&apos;t receive code? <button onClick={resendCode} className="text-primary hover:text-primary/90 font-medium">Resend code</button>
            </>
          )}
        </p>
      </div>
    </div>
  )
} 