"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from '@/lib/auth-context'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/components/ui/use-toast'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, ArrowRight, CheckCircle, PiggyBank, Target, Wallet, Loader2 } from 'lucide-react'

// Define step interfaces
interface Step1Props {
  targetAmount: string;
  setTargetAmount: (value: string) => void;
  purpose: string;
  setPurpose: (value: string) => void;
  onNext: () => void;
}

interface Step2Props {
  incomeRange: string;
  setIncomeRange: (value: string) => void;
  savingFrequency: string;
  setSavingFrequency: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

interface Step3Props {
  onBack: () => void;
  onComplete: () => void;
  loading: boolean;
}

// Step 1: Target Amount and Savings Purpose
const Step1 = ({ targetAmount, setTargetAmount, purpose, setPurpose, onNext }: Step1Props) => {
  const isValid = targetAmount.trim() !== "" && purpose.trim() !== "";

  return (
    <CardContent className="space-y-4 pt-6">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-primary" />
          <Label htmlFor="targetAmount" className="text-base font-medium">Savings Target Amount</Label>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₦</span>
          <Input
            id="targetAmount"
            type="number"
            placeholder="e.g. 500000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            className="pl-8"
          />
        </div>
        <p className="text-xs text-gray-500">Set your target savings goal amount (e.g., ₦500,000)</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <PiggyBank className="w-5 h-5 text-primary" />
          <Label htmlFor="purpose" className="text-base font-medium">Savings Purpose</Label>
        </div>
        <Input
          id="purpose"
          placeholder="e.g. House rent, Education, Business"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />
        <p className="text-xs text-gray-500">What are you saving for?</p>
      </div>

      <Button 
        onClick={onNext} 
        disabled={!isValid}
        className="w-full mt-4"
      >
        Continue <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </CardContent>
  )
}

// Step 2: Income Range and Saving Frequency
const Step2 = ({ incomeRange, setIncomeRange, savingFrequency, setSavingFrequency, onBack, onNext }: Step2Props) => {
  const isValid = incomeRange !== "" && savingFrequency !== "";

  return (
    <CardContent className="space-y-4 pt-6">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Wallet className="w-5 h-5 text-primary" />
          <Label htmlFor="incomeRange" className="text-base font-medium">Income Range</Label>
        </div>
        <Select value={incomeRange} onValueChange={setIncomeRange}>
          <SelectTrigger>
            <SelectValue placeholder="Select your income range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BELOW_50K">Below ₦50,000</SelectItem>
            <SelectItem value="RANGE_50K_100K">₦50,000 - ₦100,000</SelectItem>
            <SelectItem value="RANGE_100K_200K">₦100,000 - ₦200,000</SelectItem>
            <SelectItem value="RANGE_200K_350K">₦200,000 - ₦350,000</SelectItem>
            <SelectItem value="RANGE_350K_500K">₦350,000 - ₦500,000</SelectItem>
            <SelectItem value="ABOVE_500K">Above ₦500,000</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">Select your monthly income range</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <Label htmlFor="savingFrequency" className="text-base font-medium">Preferred Saving Frequency</Label>
        </div>
        <Select value={savingFrequency} onValueChange={setSavingFrequency}>
          <SelectTrigger>
            <SelectValue placeholder="How often do you want to save?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">Choose how often you prefer to make contributions</p>
      </div>

      <div className="flex space-x-3 mt-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={!isValid} className="flex-1">
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  )
}

// Step 3: Confirmation
const Step3 = ({ onBack, onComplete, loading }: Step3Props) => {
  return (
    <CardContent className="pt-6 text-center">
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">Almost Done!</h3>
        <p className="text-gray-600 text-sm max-w-md">
          Your profile preferences will be saved. You're now ready to start your saving journey with CoopWise.
        </p>
        
        <div className="mt-6 space-y-3">
          <ul className="space-y-2 text-left">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">Create or join a savings group</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">Make regular contributions</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">Receive AI-powered financial insights</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex space-x-3 mt-8">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={loading}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onComplete} className="flex-1" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Complete & Go to Dashboard"
          )}
        </Button>
      </div>
    </CardContent>
  )
}

export default function ProfileSetupPage() {
  const router = useRouter()
  const { user, isAuthenticated, updateUserProfile, loading: authLoading } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [targetAmount, setTargetAmount] = useState("")
  const [purpose, setPurpose] = useState("")
  const [incomeRange, setIncomeRange] = useState("")
  const [savingFrequency, setSavingFrequency] = useState("")

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  // Pre-fill form with existing data if available
  useEffect(() => {
    if (user) {
      if (user.target_savings_amount) {
        setTargetAmount(user.target_savings_amount.toString());
      }
      if (user.savings_purpose) {
        setPurpose(user.savings_purpose);
      }
      if (user.income_range) {
        setIncomeRange(user.income_range);
      }
      if (user.saving_frequency) {
        setSavingFrequency(user.saving_frequency);
      }
    }
  }, [user]);

  const handleNext = () => {
    setCurrentStep(prev => prev + 1)
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleComplete = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (!user || !user.id) {
        throw new Error('User information is missing')
      }
      
      // Prepare the exact format expected by the API
      const updateData = {
        id: user.id,
        resource_owner_id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number,
        role: user.role || "user",
        target_savings_amount: targetAmount ? parseFloat(targetAmount) : 0,
        savings_purpose: purpose || "",
        income_range: incomeRange === "BELOW_50K" ? "Below 50K" : 
                     incomeRange === "RANGE_50K_100K" ? "50K - 100K" :
                     incomeRange === "RANGE_100K_200K" ? "100K - 200K" :
                     incomeRange === "RANGE_200K_350K" ? "200K - 350K" :
                     incomeRange === "RANGE_350K_500K" ? "350K - 500K" :
                     incomeRange === "ABOVE_500K" ? "Above 500K" : "Below 50K",
        saving_frequency: savingFrequency || "daily",
        is_email_verified: user.is_email_verified !== undefined ? user.is_email_verified : false,
        is_phone_verified: user.is_phone_verified !== undefined ? user.is_phone_verified : false,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log(`Updating user profile for user ID: ${user.id}`, updateData)
      
      try {
        // Use the updateUserProfile function from auth context
        const result = await updateUserProfile(updateData);
        console.log("Update result:", result);
        
        toast({
          title: "Profile Setup Complete",
          description: "Your profile has been updated successfully!",
        })
        
        // Redirect to dashboard
        router.push('/dashboard')
      } catch (updateError: any) {
        console.error("Update error details:", updateError);
        console.error("Update error response:", updateError.response?.data);
        throw updateError;
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      
      let errorMessage = 'Failed to update your profile';
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((err: any) => 
            `${err.loc.join('.')}: ${err.msg}`
          ).join(', ');
        } else {
          errorMessage = error.response.data.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage)
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate progress
  const progress = (currentStep / 3) * 100

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            Help us personalize your CoopWise experience
          </CardDescription>
          <Progress value={progress} className="h-2 mt-2" />
          <div className="text-xs text-[#02696F] text-right">Step {currentStep} of 3</div>
        </CardHeader>
        
        {error && (
          <div className="px-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
        
        {currentStep === 1 && (
          <Step1 
            targetAmount={targetAmount}
            setTargetAmount={setTargetAmount}
            purpose={purpose}
            setPurpose={setPurpose}
            onNext={handleNext}
          />
        )}
        
        {currentStep === 2 && (
          <Step2 
            incomeRange={incomeRange}
            setIncomeRange={setIncomeRange}
            savingFrequency={savingFrequency}
            setSavingFrequency={setSavingFrequency}
            onBack={handleBack}
            onNext={handleNext}
          />
        )}
        
        {currentStep === 3 && (
          <Step3 
            onBack={handleBack}
            onComplete={handleComplete}
            loading={loading}
          />
        )}
        
        <CardFooter className="flex justify-between border-t pt-4 text-xs text-gray-500">
          <div>Your data is securely stored</div>
          <div>CoopWise © {new Date().getFullYear()}</div>
        </CardFooter>
      </Card>
    </div>
  )
} 