"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Info } from 'lucide-react'

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Schema for invite code validation
const inviteCodeSchema = z.object({
  inviteCode: z.string().min(6, {
    message: "Invite code must be at least 6 characters.",
  }),
})

// Mock group data - in a real app, this would come from the API after verifying the code
const mockGroupData = {
  name: "Charity Association",
  description: "Association of entrepreneurs...",
  contributionAmount: "₦100,000",
  frequency: "Monthly",
  memberCount: "8 out of 10",
  rules: [
    "All members must contribute ₦1,000 every week as agreed by the group.",
    "Payouts will follow a set order based on the member's payout number.",
    "Member who pays late will be charged ₦100 late fee."
  ]
}

export default function JoinGroupForm() {
  const router = useRouter()
  const [verifying, setVerifying] = useState(false)
  const [showGroupDetails, setShowGroupDetails] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  const form = useForm<z.infer<typeof inviteCodeSchema>>({
    resolver: zodResolver(inviteCodeSchema),
    defaultValues: {
      inviteCode: "",
    },
  })
  
  // Function to verify the invite code
  function onVerifyCode(values: z.infer<typeof inviteCodeSchema>) {
    setVerifying(true)
    
    // In a real app, this would make an API call to verify the code
    setTimeout(() => {
      setVerifying(false)
      setShowGroupDetails(true)
    }, 1000)
  }
  
  // Function to join the group
  function onJoinGroup() {
    setShowGroupDetails(false)
    
    // In a real app, this would make an API call to join the group
    setTimeout(() => {
      setShowSuccessModal(true)
    }, 500)
  }
  
  // Function to go back to the dashboard
  function goToDashboard() {
    router.push('/dashboard')
  }
  
  return (
    <div>
      {/* Main Form */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onVerifyCode)} className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Enter an invite code you got from the group admin or a member of the group to join their saving group
              </p>
            
              <FormField
                control={form.control}
                name="inviteCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invite code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. 7B36AJ" 
                        {...field} 
                        className="text-base py-6"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full py-6" 
              disabled={verifying}
            >
              {verifying ? "Verifying..." : "Verify Code"}
            </Button>
          </form>
        </Form>
        
        <div className="mt-8 pt-6 border-t">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              Do you need an invite code?
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Contact the admin or any member of the group you want to join and request an invite code
            </p>
          </div>
        </div>
      </div>
      
      {/* Group Details Modal */}
      <Dialog open={showGroupDetails} onOpenChange={setShowGroupDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Group Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Group Name:</h3>
              <p className="font-medium">{mockGroupData.name}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description:</h3>
              <p>{mockGroupData.description}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Contribution Amount/Frequency:</h3>
              <p>{mockGroupData.contributionAmount}/{mockGroupData.frequency}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Number of Members:</h3>
              <p>{mockGroupData.memberCount}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Group Rules:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {mockGroupData.rules.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <DialogFooter className="flex flex-row space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowGroupDetails(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onJoinGroup}
              className="flex-1"
            >
              Join Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="flex justify-center my-6">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          
          <DialogTitle className="text-xl">You've joined Just Us group!</DialogTitle>
          <DialogDescription className="text-center">
            You've been added to the group.<br />
            Check your dashboard to see your payout number and start saving with others.
          </DialogDescription>
          
          <div className="mt-6">
            <Button
              type="button"
              onClick={goToDashboard}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 