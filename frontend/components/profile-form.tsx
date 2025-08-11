"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


export default function ProfileForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    incomeRange: "",
    savingGoal: "",
    savingAmount: "",
    savingFrequency: "",
    otherGoalText: ""
  })

  const otherGoalInputRef = useRef<HTMLInputElement>(null)
  
  const steps = [
    {
      id: 1,
      title: "Monthly Income Range",
      question: "What is your monthly income?",
      description: "This helps us recommend savings goals that work for you. Don't worry, only you can see this.",
      field: "incomeRange",
      type: "dropdown",
      options: [
        { value: "0-49999", label: "Below ₦50,000" },
        { value: "50000-99999", label: "₦50,000 - ₦100,000" },
        { value: "100000-199999", label: "₦100,000 - ₦200,000" },
        { value: "200000-499999", label: "₦200,000 - ₦500,000" },
        { value: "500000+", label: "Above ₦500,000" }
      ]
    },
    {
      id: 2,
      title: "Saving Goal",
      question: "What are you saving for?",
      description: "Choose a goal so we can help you stay on track. You can always change it later.",
      field: "savingGoal",
      type: "dropdown",
      options: [
        { value: "house-rent", label: "House Rent" },
        { value: "education", label: "Education" },
        { value: "family-upkeep", label: "Family Upkeep" },
        { value: "business", label: "Business" },
        { value: "others", label: "Others" }
      ]
    },
    {
      id: 3,
      title: "Saving Amount",
      question: "How much would you like to save regularly?",
      description: "Setting a target helps you stay consistent. Don't worry, you can change it anytime.",
      field: "savingAmount",
      type: "input-number"
    },
    {
      id: 4,
      title: "Saving Frequency",
      question: "How often would you like to save?",
      description: "Choose a schedule that works best for you. You can always adjust it later.",
      field: "savingFrequency",
      type: "dropdown",
      options: [
        { value: "daily", label: "Daily" },
        { value: "weekly", label: "Weekly" },
        { value: "bi-weekly", label: "Bi-weekly" },
        { value: "monthly", label: "Monthly" }
      ]
    }
  ]
  
  const currentStepData = steps[currentStep - 1]
  
  const handleSelect = (value: string) => {
    if (currentStepData.field === "savingGoal" && value === "others") {
      setTimeout(() => {
        otherGoalInputRef.current?.focus();
      }, 100);
    }
    
    setFormData({
      ...formData,
      [currentStepData.field]: value
    })
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // For number input, only allow numbers
    if (name === "savingAmount" && !/^\d*$/.test(value)) {
      return;
    }
    
    setFormData({
      ...formData,
      [name]: value
    })
  }
  
  const handleNext = () => {
    if (isCurrentStepValid()) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmit()
      }
    }
  }
  
  const handleSkip = () => {
    // Skip current step and move to next
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push('/dashboard')
    }
  }

  const handleSubmit = () => {
    // Submit all profile data
    console.log(formData)
    
    // Redirect to dashboard
    router.push('/dashboard')
  }
  
  const isCurrentStepValid = () => {
    const currentField = currentStepData.field;
    
    if (currentField === "savingGoal" && formData[currentField] === "others") {
      return formData.otherGoalText.trim() !== "";
    }
    
    if (currentField === "savingAmount") {
      return formData[currentField].trim() !== "";
    }
    
    return formData[currentField as keyof typeof formData] !== "";
  }

  const isLastStep = currentStep === steps.length;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-md w-full mx-auto">
      <div className="mb-6">
        <div className="flex justify-start mb-5">
          <Link href="/" className="inline-block">
            <div className="text-sm text-secondary flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              {isLastStep ? "Back" : "Back to Home"}
            </div>
          </Link>
        </div>
        
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-primary">Complete Your Profile</h2>
          <p className="text-sm text-secondary mt-1">This helps us personalize your experience</p>
        </div>
        
        {/* Step progress dots */}
        <div className="flex justify-center items-center my-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              {/* Dot/Circle for step */}
              <div 
                className={`w-3 h-3 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out
                  ${currentStep >= step.id ? 'bg-primary' : 'bg-gray-200'}`}
              >
                {step.id < currentStep && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                )}
              </div>
              
              {/* Connecting line (if not the last step) */}
              {index < steps.length - 1 && (
                <div className="w-8 mx-1">
                  <div className={`h-0.5 transition-all duration-300 ease-in-out
                    ${currentStep > step.id ? 'bg-primary' : 'bg-gray-200'}`}>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <h3 className="font-medium text-foreground text-lg">{currentStepData.question}</h3>
          <p className="text-sm text-secondary mt-1">
            {currentStepData.description}
          </p>
        </div>
        
        <div className="space-y-2 mt-4">
          <Label htmlFor={currentStepData.field} className="text-sm font-medium">{currentStepData.title}</Label>
          
          {currentStepData.type === "dropdown" && (
            <div className="relative">
              <Select 
                value={formData[currentStepData.field as keyof typeof formData]} 
                onValueChange={handleSelect}
              >
                <SelectTrigger className="w-full rounded h-10 border border-gray-300">
                  <SelectValue placeholder={`Select ${currentStepData.title === 'Monthly Income Range' ? 'income range' : currentStepData.title === 'Saving Frequency' ? 'how often you want to save' : 'a goal'}`} />
                </SelectTrigger>
                <SelectContent>
                  {currentStepData.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {currentStepData.field === "savingGoal" && formData.savingGoal === "others" && (
                <Input
                  ref={otherGoalInputRef}
                  type="text"
                  name="otherGoalText"
                  placeholder="Enter your saving goal"
                  value={formData.otherGoalText}
                  onChange={handleInputChange}
                  className="w-full h-10 border border-gray-300 rounded mt-2"
                />
              )}
            </div>
          )}
          
          {currentStepData.type === "input-number" && (
            <div className="relative">
              <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                <span className="pl-3 text-gray-500">#</span>
                <Input
                  id={currentStepData.field}
                  name={currentStepData.field}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter amount"
                  value={formData[currentStepData.field as keyof typeof formData]}
                  onChange={handleInputChange}
                  className="w-full h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          )}

          {currentStepData.field === "savingFrequency" && formData.savingFrequency && (
            <div className="mt-2 space-y-2">
              {formData.savingFrequency === "weekly" && (
                <div className="border border-gray-200 bg-gray-50 rounded p-3 text-sm">
                  <div className="text-primary font-medium">Weekly savings</div>
                  <div className="text-gray-500">Your savings will be processed every week</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between pt-6 mt-6">
          {!isLastStep ? (
            <>
              <Link href="#" onClick={(e) => { e.preventDefault(); handleSkip(); }} className="text-primary hover:text-primary/80 text-sm font-medium">
                Skip for now
              </Link>
              
              <Button 
                type="button"
                onClick={handleNext}
                disabled={!isCurrentStepValid()}
                className={`px-6 py-2 rounded ${
                  isCurrentStepValid() 
                    ? "bg-primary hover:bg-primary/90 text-white" 
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Next
              </Button>
            </>
          ) : (
            <>
              <div></div> {/* Empty div to maintain the flex layout */}
              
              <Button 
                type="button"
                onClick={handleSubmit}
                disabled={!isCurrentStepValid()}
                className={`px-6 py-2 rounded ${
                  isCurrentStepValid() 
                    ? "bg-primary hover:bg-primary/90 text-white" 
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Complete Setup
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 