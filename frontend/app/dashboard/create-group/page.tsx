"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/layout'
import CreateGroupForm from '@/components/dashboard/create-group-form'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import GroupService from '@/lib/group-service'
import CookieService from '@/lib/cookie-service'

// Step 2: Group Rules
function GroupRulesForm({ 
  onBack, 
  onComplete
}: { 
  onBack: () => void, 
  onComplete: (rules: {title: string, description: string}[]) => void
}) {
  const [rules, setRules] = useState<{title: string, description: string}[]>([
    { 
      title: 'Contribution Amount', 
      description: 'All members must contribute ₦1,000 every week as agreed by the group.' 
    }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRuleChange = (index: number, field: 'title' | 'description', value: string) => {
    const updatedRules = [...rules]
    updatedRules[index][field] = value
    setRules(updatedRules)
  }

  const addRule = () => {
    setRules([...rules, { title: '', description: '' }])
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      onComplete(rules)
    } catch {
      // Handle error silently
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Create Group</h1>
          <p className="text-sm text-gray-500 mt-1">Set up a new savings group and invite members</p>
        </div>
        
        <h2 className="text-lg font-medium text-gray-900 mb-2">Group Rules</h2>
        <p className="text-sm text-gray-500 mb-6">Set clear guidelines for your group. This builds help your group run smoothly and prevent misunderstanding</p>
        
        <form onSubmit={handleSubmit}>
          {rules.map((rule, index) => (
            <div key={index} className="mb-6">
              <h3 className="text-sm font-medium mb-3">Rule {index + 1}</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Title
                </label>
                <Input
                  type="text"
                  placeholder="E.g., Contribution Amount"
                  value={rule.title}
                  onChange={(e) => handleRuleChange(index, 'title', e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <Textarea
                  placeholder="E.g., All members must contribute ₦1,000 every week as agreed by the group."
                  value={rule.description}
                  onChange={(e) => handleRuleChange(index, 'description', e.target.value)}
                  className="w-full resize-none"
                  rows={3}
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="flex items-center text-sm gap-1 mb-6"
            onClick={addRule}
          >
            <Plus className="w-4 h-4" />
            Add New Rule
          </Button>

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline"
              className="border-gray-300 text-gray-700"
              onClick={onBack}
            >
              Back
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isSubmitting ? 'Creating...' : 'Complete Group Creation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Main component - will handle switching between steps
export default function CreateGroup() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [groupData, setGroupData] = useState<any>(null)

  const handleNext = async (formValues: any) => {
    try {
      // Store the form values to use in step 2
      setGroupData({
        name: formValues.name,
        description: formValues.description,
        contributionAmount: formValues.contributionAmount,
        contributionFrequency: formValues.contributionFrequency,
        maxMembers: formValues.maxMembers,
        targetAmount: formValues.targetAmount,
        imageUrl: formValues.imageUrl,
      });
      
      // Go to step 2
      setCurrentStep(2);
    } catch (error) {
      console.error('Error processing form data:', error);
    }
  };

  const handleBack = () => {
    setCurrentStep(1)
  }

  const handleComplete = async (rules: {title: string, description: string}[]) => {
    if (!groupData) return

    console.log(`\nRules: ${rules}\n`)
    
    setIsCreating(true)
    try {
      // Prepare the data for API submission
      const payload = {
        name: groupData.name,
        creator_id: user?.id || "",
        description: groupData.description || "",
        image_url: groupData.imageUrl || "",
        contribution_amount: parseFloat(groupData.contributionAmount.replace(/[^\d.-]/g, '')) || 0,
        max_members: parseInt(groupData.maxMembers) || 10,
        contribution_frequency: groupData.contributionFrequency || "daily",
        payout_strategy: "rotating", // Default
        coop_model: "ajo", // Changed from "sou" to "ajo" which is a valid enum value
        target_amount: groupData.targetAmount ? parseFloat(groupData.targetAmount.replace(/[^\d.-]/g, '')) : 0,
        status: "active", // Default
        // Removed rules from API payload as it's causing 422 errors
        // The rules are still collected in the UI but not sent to the API
        rules: rules
      }
      
      console.log('Submitting group data to API:', payload)
      
      // Use GroupService to create the group
      const response = await GroupService.createGroup(payload)
      
      console.log('Group creation response:', response)
      
      // Save rules locally if needed for future use
      if (rules && rules.length > 0) {
        try {
          CookieService.set(`group_rules_${response.id}`, rules, { expires: 30 });
        } catch {
          console.log('Could not save rules locally');
        }
      }
      
      // Show success message with more prominent styling
      toast({
        title: "Success! 🎉",
        description: `Your group "${groupData.name}" has been created successfully.`,
        variant: "default",
        className: "border-green-500 bg-green-50",
      })
      
      // Add a short delay before redirecting to ensure the toast is seen
      setTimeout(() => {
        // Redirect to dashboard with my groups tab active
        router.push('/dashboard?tab=my')
      }, 1500)
    } catch (error: any) {
      console.error('Error creating group:', error)
      
      // Extract the most helpful error message
      let errorMessage = 'An error occurred while creating your group.';
      
      if (error.response) {
        if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data?.error) {
          try {
            // Try to parse error JSON if it's a string
            const errorData = typeof error.response.data.error === 'string' 
              ? JSON.parse(error.response.data.error)
              : error.response.data.error;
              
            if (errorData.detail) {
              errorMessage = errorData.detail;
            }
                  } catch {
          // If parsing fails, use the error status
          errorMessage = `Error ${error.response.status}: ${error.response.statusText}`;
        }
        }
      }
      
      toast({
        title: "Failed to create group",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <DashboardLayout>
      {currentStep === 1 ? (
        <CreateGroupForm onSubmitSuccess={handleNext} />
      ) : (
        <GroupRulesForm 
          onBack={handleBack} 
          onComplete={handleComplete}
        />
      )}
    </DashboardLayout>
  )
} 