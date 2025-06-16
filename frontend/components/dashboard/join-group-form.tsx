"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Info, Loader2 } from 'lucide-react'

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
import { useToast } from "@/components/ui/use-toast"
import GroupService from '@/lib/group-service'

// Schema for invite code validation
const inviteCodeSchema = z.object({
  inviteCode: z.string().min(6, {
    message: "Invite code must be at least 6 characters.",
  }),
})

// Interface for group data
interface GroupData {
  name: string;
  description: string;
  contributionAmount: string | number;
  frequency: string;
  memberCount: string;
  rules: string[];
}

export default function JoinGroupForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [verifying, setVerifying] = useState(false)
  const [joining, setJoining] = useState(false)
  const [showGroupDetails, setShowGroupDetails] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [groupData, setGroupData] = useState<GroupData>({
    name: "",
    description: "",
    contributionAmount: "",
    frequency: "",
    memberCount: "",
    rules: []
  })
  const [currentInviteCode, setCurrentInviteCode] = useState("")
  
  const form = useForm<z.infer<typeof inviteCodeSchema>>({
    resolver: zodResolver(inviteCodeSchema),
    defaultValues: {
      inviteCode: "",
    },
  })
  
  // Function to verify the invite code
  async function onVerifyCode(values: z.infer<typeof inviteCodeSchema>) {
    setVerifying(true)
    setCurrentInviteCode(values.inviteCode)
    
    try {
      // Call the API to verify the invite code
      const response = await GroupService.verifyInviteCode(values.inviteCode);
      console.log('Verify response:', response);
      
      // Extract group data from the response
      if (response && response.membership) {
        const membership = response.membership;
        
        // Check if the user has already joined this group
        if (membership.status && membership.status.toLowerCase() !== 'clicked') {
          toast({
            title: "Already Joined",
            description: "You have already joined or requested to join this group.",
            variant: "default",
          });
          
          // Still fetch and show group details
        }
        
        // Get group details
        try {
          const groupDetails = await GroupService.getGroupDetails(membership.group_id);
          console.log('Group details:', groupDetails);
          
          if (groupDetails) {
            // Format the data for display
            setGroupData({
              name: groupDetails.name || "Unknown Group",
              description: groupDetails.description || "No description available",
              contributionAmount: groupDetails.contribution_amount || 0,
              frequency: groupDetails.contribution_frequency || "Not specified",
              memberCount: `${groupDetails.members?.length || 0} out of ${groupDetails.max_members || 'unlimited'}`,
              rules: groupDetails.rules || []
            });
            
            // Show the group details modal
            setShowGroupDetails(true);
          }
        } catch (error: any) {
          console.error("Error fetching group details:", error);
          toast({
            title: "Error",
            description: error.message || "Could not fetch group details. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Invalid invite code or group not found.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error verifying invite code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify invite code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  }
  
  // Function to join the group
  async function onJoinGroup() {
    setJoining(true);
    
    try {
      // Call the API to accept the invite code
      const response = await GroupService.acceptInviteCode(currentInviteCode);
      console.log('Join response:', response);
      
      // Close the group details modal and show success
      setShowGroupDetails(false);
      
      // Always show success modal after attempting to join
      setShowSuccessModal(true);
      
      // Notify user of success
      toast({
        title: "Success",
        description: "You have successfully joined the group!",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error joining group:", error);
      
      // Close the group details dialog
      setShowGroupDetails(false);
      
      // Show error toast
      toast({
        title: "Error",
        description: error.message || "Failed to join group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
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
              <div className="mb-6 space-y-3">
                <p className="text-sm text-gray-600">
                  Enter an invite code you received from a group admin or member to join their saving group
                </p>
                
                <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                  <h4 className="text-sm font-medium text-blue-800 flex items-center mb-2">
                    <Info className="h-4 w-4 mr-2" />
                    How to join a group
                  </h4>
                  <ol className="text-xs text-blue-800 space-y-1 list-decimal ml-4">
                    <li>Paste the invite code you received</li>
                    <li>Review the group details</li>
                    <li>Confirm to join the group</li>
                    <li>Wait for admin approval (if required)</li>
                  </ol>
                </div>
              </div>
            
              <FormField
                control={form.control}
                name="inviteCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invite code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. cpw-invite-11111111-1111-1111-1111-111111111111:0000000-0000-0000-0000-00000000000" 
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
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : "Verify Code"}
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
              <p className="font-medium">{groupData.name}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description:</h3>
              <p>{groupData.description}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Contribution Amount/Frequency:</h3>
              <p>₦{groupData.contributionAmount}/{groupData.frequency}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Number of Members:</h3>
              <p>{groupData.memberCount}</p>
            </div>
            
            {groupData.rules.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Group Rules:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {groupData.rules.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-row space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowGroupDetails(false)}
              className="flex-1"
              disabled={joining}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onJoinGroup}
              className="flex-1"
              disabled={joining}
            >
              {joining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : "Join Group"}
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
          
          <DialogTitle className="text-xl">You've joined {groupData.name}!</DialogTitle>
          <DialogDescription className="text-center">
            Your membership is pending approval from the group admin.<br />
            Once approved, you can start saving with others.
          </DialogDescription>
          
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-left my-4">
            <h4 className="text-sm font-medium text-blue-800 flex items-center mb-2">
              <Info className="h-4 w-4 mr-2" />
              What happens next?
            </h4>
            <ul className="text-xs text-blue-800 space-y-2 list-disc ml-4">
              <li>Your request will be reviewed by the group admin</li>
              <li>Once approved, you'll see your payout position</li>
              <li>You'll be notified when your membership is approved</li>
              <li>View your membership status in "My Groups" section</li>
            </ul>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/join-group')}
              className="flex-1"
            >
              Join Another
            </Button>
            <Button
              type="button"
              onClick={() => router.push('/dashboard/my-group')}
              className="flex-1"
            >
              My Groups
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 