"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from '@/lib/auth-context'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, ArrowRight, CheckCircle, PiggyBank, Target, Wallet, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { motion, AnimatePresence } from 'framer-motion'

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

// Step indicators component with knots
const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { title: "Savings Goal", icon: <Target className="h-4 w-4" /> },
    { title: "Income Info", icon: <Wallet className="h-4 w-4" /> },
    { title: "Complete", icon: <CheckCircle className="h-4 w-4" /> },
  ];

  return (
    <div className="flex justify-between items-center w-full px-4 py-3">
      {steps.map((step, index) => {
        const isActive = currentStep >= index + 1;
        const isCompleted = currentStep > index + 1;
        
        return (
          <React.Fragment key={index}>
            {/* Step knot */}
            <div className="flex flex-col items-center">
              <div 
                className={`rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted 
                    ? "bg-emerald-500 text-white h-10 w-10" 
                    : isActive
                    ? "bg-primary text-white h-10 w-10" 
                    : "bg-gray-200 text-gray-500 h-8 w-8"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  step.icon
                )}
              </div>
              <span className={`text-xs mt-1 ${isActive ? "text-primary font-medium" : "text-gray-500"}`}>
                {step.title}
              </span>
            </div>
            
            {/* Connector line between knots */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2">
                <div className={`h-1 ${
                  currentStep > index + 1 ? "bg-emerald-500" : "bg-gray-200"
                } rounded`}></div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Step 1: Target Amount and Savings Purpose
const Step1 = ({ targetAmount, setTargetAmount, purpose, setPurpose, onNext }: Step1Props) => {
  const isValid = targetAmount.trim() !== "" && purpose.trim() !== "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
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
              className="pl-8 transition-all focus:ring-2 focus:ring-primary/20"
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
            className="transition-all focus:ring-2 focus:ring-primary/20"
        />
        <p className="text-xs text-gray-500">What are you saving for?</p>
      </div>

      <Button 
        onClick={onNext} 
        disabled={!isValid}
          className="w-full mt-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        Continue <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </CardContent>
    </motion.div>
  )
}

// Step 2: Income Range and Saving Frequency
const Step2 = ({ incomeRange, setIncomeRange, savingFrequency, setSavingFrequency, onBack, onNext }: Step2Props) => {
  const isValid = incomeRange !== "" && savingFrequency !== "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
    <CardContent className="space-y-4 pt-6">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Wallet className="w-5 h-5 text-primary" />
          <Label htmlFor="incomeRange" className="text-base font-medium">Income Range</Label>
        </div>
        <Select value={incomeRange} onValueChange={setIncomeRange}>
            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
            <SelectValue placeholder="Select your income range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="below_50k">Below ₦50,000</SelectItem>
            <SelectItem value="range_50k_100k">₦50,000 - ₦100,000</SelectItem>
            <SelectItem value="range_100k_200k">₦100,000 - ₦200,000</SelectItem>
            <SelectItem value="range_200k_350k">₦200,000 - ₦350,000</SelectItem>
            <SelectItem value="range_350k_500k">₦350,000 - ₦500,000</SelectItem>
            <SelectItem value="above_500k">Above ₦500,000</SelectItem>
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
            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
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
          <Button 
            variant="outline" 
            onClick={onBack} 
            className="flex-1 transition-all hover:bg-gray-100 hover:text-gray-900 border border-gray-300"
          >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
          <Button 
            onClick={onNext} 
            disabled={!isValid} 
            className="flex-1 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </CardContent>
    </motion.div>
  )
}

// Step 3: Confirmation
const Step3 = ({ onBack, onComplete, loading }: Step3Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
    <CardContent className="pt-6 text-center">
      <div className="flex flex-col items-center justify-center space-y-3">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600"
          >
          <CheckCircle className="w-8 h-8" />
          </motion.div>
        <h3 className="text-xl font-semibold text-gray-800">Almost Done!</h3>
        <p className="text-gray-600 text-sm max-w-md">
          Your profile preferences will be saved. You're now ready to start your saving journey with CoopWise.
        </p>
        
        <div className="mt-6 space-y-3">
          <ul className="space-y-2 text-left">
              <motion.li 
                className="flex items-start"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">Create or join a savings group</span>
              </motion.li>
              <motion.li 
                className="flex items-start"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">Make regular contributions</span>
              </motion.li>
              <motion.li 
                className="flex items-start"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">Receive AI-powered financial insights</span>
              </motion.li>
          </ul>
        </div>
      </div>

      <div className="flex space-x-3 mt-8">
          <Button 
            variant="outline" 
            onClick={onBack} 
            className="flex-1 transition-all hover:bg-gray-100 hover:text-gray-900 border border-gray-300" 
            disabled={loading}
          >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
          <Button 
            onClick={onComplete} 
            className="flex-1 transition-all hover:scale-[1.02] active:scale-[0.98] bg-green-600 hover:bg-green-700" 
            disabled={loading}
          >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
              "Complete Setup"
          )}
        </Button>
      </div>
    </CardContent>
    </motion.div>
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
        income_range: incomeRange === "below_50K" ? "Below 50K" : 
                     incomeRange === "range_50k_100k" ? "50K - 100K" :
                     incomeRange === "range_100k_200k" ? "100K - 200K" :
                     incomeRange === "range_200k_350k" ? "200K - 350K" :
                     incomeRange === "range_350k_500k" ? "350K - 500K" :
                     incomeRange === "above_50k" ? "Above 500K" : "Below 50K",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden border-0 shadow-lg">
        <CardHeader className="space-y-1 bg-white border-b pb-4">
          <CardTitle className="text-2xl font-bold text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            Help us personalize your CoopWise experience
          </CardDescription>
          
          {/* Step indicator with knots */}
          <StepIndicator currentStep={currentStep} />
        </CardHeader>
        
        {error && (
          <div className="px-6 pt-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
        
        <AnimatePresence mode="wait">
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
        </AnimatePresence>
        
        <CardFooter className="flex justify-between border-t pt-4 text-xs text-gray-500">
          <div>Your data is securely stored</div>
          <div>CoopWise © {new Date().getFullYear()}</div>
        </CardFooter>
      </Card>
    </div>
  )
} 