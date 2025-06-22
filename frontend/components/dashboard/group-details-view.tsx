"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Loader2, Share, Check, Copy, Info } from 'lucide-react'
import Link from 'next/link'
import GroupService from '@/lib/group-service'
import { toast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import AuthService from '@/lib/auth-service'
import ContributionService from '@/lib/contribution-service'
import useAuthStore from '@/lib/stores/auth-store'
import { Contribution } from '@/lib/types'
import { UserDetail } from '@/lib/dashboard-service'
import { formatCurrency } from '@/lib/contribution-utils'

interface GroupDetailsViewProps {
  groupId: string
}
export type iGroupRule = {
  title: string
  description: string
}

export enum MembershipRole {
  ADMIN = "admin",
  MEMBER = "member"
}

export enum MembershipStatus {
  CLICKED = "clicked",
  ACCEPTED = "accepted",
  PENDING = "pending",
  REJECTED = "rejected",
  CANCELLED = "cancelled"
}

export interface MembershipDetails {
  id: number
  user_id?: string | null       
  group_id: string            
  role: MembershipRole
  invited_by: string         
  status: MembershipStatus
  joined_at?: string | null     
  created_at: string            
  updated_at: string            
}

// Extends MembershipDetails with the full user info
export interface MembershipExtDetails extends MembershipDetails {
  user: UserDetail
}

export enum ContributionStatus {
  PLEDGED = "pledged",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
} 
export interface ContributionDetail {
  id: string          
  user_id: string      
  group_id: string  
  amount: number
  currency?: string    
  due_date?: string | null   
  note?: string | null
  status: ContributionStatus
  created_at: string    
  updated_at: string    
}

// Type definition for extended group details
interface GroupDetails {
  id: string;
  name: string;
  creator_id: string;
  description: string;
  contribution_amount: number;
  contribution_frequency: string;
  payout_strategy: string;
  coop_model: string;
  max_members: number;
  target_amount: number;
  status: string;
  created_at: string;
  rules: iGroupRule[]
  updated_at: string;

  contributions: ContributionDetail[]
  members: MembershipExtDetails[]

  // Additional UI-specific fields
  nextContribution?: {
    amount: number;
    dueDate: string;
    daysLeft: number;
  };
  nextPayout?: {
    amount: number;
    recipient: string;
    date: string;
  };
  totalSaved?: number;
  progress?: number;
  memberCount?: number;
}

// Helper function to format dates
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (error) {
    return dateString;
  }
};

// Helper function to calculate next contribution date
const getNextContributionDate = (frequency: string): { dueDate: string, daysLeft: number } => {
  const today = new Date();
  let nextDate = new Date();
  
  switch(frequency) {
    case 'daily':
      nextDate.setDate(today.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(today.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(today.getMonth() + 1);
      break;
    default:
      nextDate.setDate(today.getDate() + 7); // Default to weekly
  }
  
  const diffTime = nextDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    dueDate: formatDate(nextDate.toISOString()),
    daysLeft
  };
};

// Group Header Component
const GroupHeader = ({ name, description, groupId }: { name: string; description: string; groupId: string }) => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateInviteCode = async () => {
    try {
      setIsLoading(true);
      
      // For debugging
      console.log('Generating invite code for group:', groupId);
      
      const token = AuthService.getToken();
      
      if (!token) {
        throw new Error('You must be logged in to generate an invite code');
      }
      
      // Use the API endpoint with the specific group ID
      const response = await fetch(`/api/memberships/invite?group_id=${groupId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || 'Failed to generate invite code');
      }

      const data = await response.json();
      console.log('Invite code generated successfully:', data);
      
      // Extract the invite code from the response
      const code = data.invite_code || data.code || data.inviteCode || "";
      setInviteCode(code);
      
      // Show the dialog with the invite code
      setShowInviteDialog(true);
    } catch (error) {
      console.error('Error generating invite code:', error);
      
      // Handle the specific group ID error case
      const isTestGroupId = groupId === 'ad75064d-591a-451e-8a75-508713ffc978';
      if (isTestGroupId) {
        console.error(`Error with test group ID ${groupId}:`, error);
      }
      
      toast({
        title: "Error",
        description: "Failed to generate invite code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      // Create a shareable URL that will render the OG image when shared
      const shareableUrl = `${window.location.origin}/invite/${inviteCode}`;
      await navigator.clipboard.writeText(shareableUrl);
      
      toast({
        title: "Link copied!",
        description: "Group invite link copied to clipboard",
        duration: 2000,
      });
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  return (
    <div className="mb-6">
      {/* Back button */}
  
      
      {/* Header content */}
      <div className="border rounded-md p-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{name}</h1>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          <Button 
            variant="outline" 
            className="flex items-center gap-1 text-sm"
            onClick={generateInviteCode}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Share className="h-4 w-4" />
            )}
            Share invite
          </Button>
        </div>
                </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share group invite</DialogTitle>
            <DialogDescription>
              Share this invite code with people you want to join this group.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-2">
              <label className="text-xs font-medium text-gray-500">
                Shareable Invite Link
              </label>
              <div className="flex items-center border rounded-md p-2 bg-gray-50">
                <span className="text-sm font-medium flex-1 truncate">
                  {window.location.origin}/invite/{inviteCode}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Share this link on social media to show group details
              </p>
            </div>
            <Button 
              type="button" 
              size="icon" 
              className="px-3"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="sr-only">Copy</span>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
              <h4 className="text-sm font-medium text-blue-800 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                How to share this code
              </h4>
              <ol className="text-xs text-blue-800 mt-2 space-y-1 list-decimal ml-4">
                <li>Copy the invite code above</li>
                <li>Share it with the person you want to invite</li>
                <li>Ask them to go to the "Join Group" page in CoopWise</li>
                <li>They should paste this code to join your group</li>
              </ol>
            </div>
            <p className="text-xs text-gray-500">
              This invite code will expire in 7 days. Members who join will need to be approved by the group admin.
            </p>
            <div className="border-t pt-3">
              <p className="text-xs font-medium">Direct them to:</p>
              <p className="text-sm font-semibold mt-1">CoopWise Dashboard → Join Group</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Group Stats Component
const GroupStats = ({ 
  groupData,
  memberCount, 
  totalSaved, 
  progress, 
  targetAmount,
  contributionAmount,
  contributionDueDate,
  contributionDaysLeft,
  contributionFrequency,
  payoutAmount,
  payoutRecipient,
  payoutDate
}: { 
  groupData: GroupDetails;
  memberCount: number;
  totalSaved: number;
  progress: number;
  targetAmount: number;
  contributionAmount: number;
  contributionDueDate: string;
  contributionDaysLeft: number;
  contributionFrequency: string;
  payoutAmount: number;
  payoutRecipient: string;
  payoutDate: string;
}) => {
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [countdown, setCountdown] = useState(10 * 60); // 10 minutes in seconds
  
  const { user, isAuthenticated } = useAuthStore()
  // Format countdown time as mm:ss
  const formatTime = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };
  
  // Countdown timer effect
  useEffect(() => {
    if (!showContributionModal) return;
    
    // Reset countdown when modal opens
    setCountdown(10 * 60);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [showContributionModal]);


  const handleContribution = async () => {
    try {
      if (!user?.id || !groupData?.id || !groupData?.nextContribution?.dueDate) {
        throw new Error("Missing required contribution data");
      }
  
      const getDueDate = () => {
        const date = new Date();
        date.setHours(date.getHours() + 6);
        return date.toISOString();
      };
      const contribution = {
        user_id: user.id,
        group_id: groupData.id,
        amount: contributionAmount,
        currency: 'NGN',
        due_date: getDueDate() || groupData.nextContribution.dueDate,
        note: 'Contribution via dashboard',
        status: 'completed' as const // TODO - Set the status according to payment status [pledged]
      };
      const result = await ContributionService.makeContribution(contribution);
      
      if (result) {
          toast({
            title: "Success",
            description: "Contribution submitted successfully!",
            variant: 'default'
          });
      }
      setShowContributionModal(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to submit contribution",
        variant: "destructive"
      });
    }
  };
  

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Group Savings */}
      <div className="flex-1 bg-white rounded-md p-4">
        <h2 className="text-base font-medium mb-1">Group savings</h2>
        <p className="text-xs text-gray-500">{memberCount} members in this group</p>
        
        <div className="mt-3">
          <p className="text-2xl font-bold text-gray-900">₦{totalSaved.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total saved by this group</p>
        </div>
        
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress to goal</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full">
            <div className="h-full bg-green-600 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Goal: ₦{targetAmount.toLocaleString()}</p>
            </div>
          </div>

          {/* Next Contribution */}
      <div className="flex-1 bg-white rounded-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-medium">Next Contribution</h2>
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
        
        <div className="mb-3">
          <p className="text-2xl font-bold text-gray-900">₦{contributionAmount.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Due on {contributionDueDate} ({contributionDaysLeft} days to go)</p>
        </div>
        
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center">
            <div className="w-5 h-5 text-xs flex items-center justify-center bg-gray-100 rounded-full mr-2">
              <Calendar className="h-3 w-3 text-gray-500" />
            </div>
            <span className="text-xs text-gray-500">Frequency</span>
            <span className="ml-auto text-xs text-gray-900">{contributionFrequency}</span>
                </div>
          
          <div className="flex items-center">
            <div className="w-5 h-5 text-xs flex items-center justify-center bg-gray-100 rounded-full mr-2">
              <div className="h-3 w-3 text-gray-500">!</div>
              </div>
            <span className="text-xs text-gray-500">Status</span>
            <span className="ml-auto bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">Pending</span>
              </div>
            </div>
        
        <Button 
          className="w-full bg-teal-700 hover:bg-teal-800 text-white text-sm"
          onClick={() => setShowContributionModal(true)}
        >
              Make Contribution
            </Button>
          </div>

          {/* Next Payout */}
      <div className="flex-1 bg-white rounded-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-medium">Next Payout</h2>
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
        
        <p className="text-2xl font-bold text-gray-900 mb-4">₦{payoutAmount.toLocaleString()}</p>
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            <span className="text-xs text-gray-500">Receiving Next:</span>
            <span className="ml-auto text-xs text-gray-900">{payoutRecipient}</span>
          </div>
          
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            <span className="text-xs text-gray-500">Receiving Date:</span>
            <span className="ml-auto text-xs text-gray-900">{payoutDate}</span>
          </div>
        </div>
      </div>

      {/* Contribution Modal */}
      <Dialog open={showContributionModal} onOpenChange={setShowContributionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Make Contribution</DialogTitle>
            <DialogDescription>
              Make a commitment by being consistent with your contributions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <h3 className="font-medium text-base mb-4">Make Contribution</h3>
            <div className="border-t mb-4"></div>
            
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Select Payment Option</p>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="transfer" id="transfer" />
                  <Label htmlFor="transfer">Transfer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="wallet" id="wallet" />
                  <Label htmlFor="wallet">Wallet</Label>
                </div>
              </RadioGroup>
            </div>
            
            {paymentMethod === 'transfer' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Transfer</p>
                  <p className="text-lg font-bold">₦{contributionAmount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">to:</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm font-medium">Polaris Bank</p>
                  <div className="flex items-center">
                    <p className="text-lg font-bold">0123456781</p>
                    <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 p-0">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm mt-2">Account Name</p>
                  <p className="text-sm font-medium">Charity Association Coopwise</p>
                  
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Expires in <span className="text-red-500 font-medium">{formatTime()}</span> minutes</p>
                  </div>
                </div>
              </div>
            )}
            
            {paymentMethod === 'wallet' && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Wallet Balance</p>
                    <p className="text-lg font-bold">₦500,000</p>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Contribution Amount</p>
                    <p className="text-lg font-bold">₦{contributionAmount.toLocaleString()}</p>
                  </div>
                  
                  <div className="mb-1">
                    <p className="text-sm text-gray-600">Contribute <span className="font-bold">₦{contributionAmount.toLocaleString()}</span> to:</p>
                    <p className="text-sm font-medium">Charity Association</p>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white"
                  onClick={handleContribution}
                >
                  Pay from Wallet
                </Button>
              </div>
            )}
          </div>
          
          {paymentMethod === 'transfer' && (
            <DialogFooter>
              <Button 
                type="button" 
                className="w-full bg-teal-700 hover:bg-teal-800"
                onClick={handleContribution}
              >
                Confirm Payment
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
        </div>
  );
};

// Tab type definition
type TabType = 'contributions' | 'payouts' | 'members';

// Contribution History Component with Tabs
const ContributionHistory = ({groupData} : {groupData: GroupDetails}) => {
  const [activeTab, setActiveTab] = useState<TabType>('contributions');
  
  return (
    <div className="bg-white rounded-md p-4">
      {/* Tabs Section */}
      <div className="flex mb-4 rounded-md overflow-hidden border">
          <button
            onClick={() => setActiveTab('contributions')}
          className={`py-2 flex-1 text-center font-medium text-sm ${activeTab === 'contributions' ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Contributions
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
          className={`py-2 flex-1 text-center font-medium text-sm ${activeTab === 'payouts' ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Payouts
          </button>
          <button
            onClick={() => setActiveTab('members')}
          className={`py-2 flex-1 text-center font-medium text-sm ${activeTab === 'members' ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          Group Members
        </button>
      </div>
      
      {activeTab === 'contributions' && (
        <>
          <div className="mb-3">
            <h2 className="text-base font-medium">Contribution History</h2>
            <p className="text-xs text-gray-500">All your past savings in this group</p>
          </div>
          
          {/* Contribution items */}
          {groupData.contributions.length > 0 && (
            <div className="space-y-4 mt-4">
              {groupData.contributions.map((contribution) => {
                const isFullPayment = contribution.amount >= groupData.contribution_amount
                const badgeClass = isFullPayment
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
                const badgeText = isFullPayment ? "Full Payment" : "Part Payment"

                return (
                  <div key={contribution.id} className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                        {/* You can swap this with your <Image /> or keep the <svg> */}
                        <svg className="w-3 h-3 text-teal-700" viewBox="0 0 24 24" fill="none">
                          <path d="M12 12.75C8.83 12.75 6.25 10.17 6.25 7C6.25 3.83 8.83 1.25 12 1.25C15.17 1.25 17.75 3.83 17.75 7C17.75 10.17 15.17 12.75 12 12.75ZM12 2.75C9.66 2.75 7.75 4.66 7.75 7C7.75 9.34 9.66 11.25 12 11.25C14.34 11.25 16.25 9.34 16.25 7C16.25 4.66 14.34 2.75 12 2.75Z" fill="currentColor"/>
                          <path d="M3.41 22.75C3 22.75 2.65 22.45 2.65 22C2.65 17.15 6.8 13.15 12 13.15C17.2 13.15 21.35 17.15 21.35 22C21.35 22.45 21 22.75 20.59 22.75C20.18 22.75 19.83 22.45 19.83 22C19.83 17.95 16.3 14.65 12 14.65C7.7 14.65 4.17 17.95 4.17 22C4.17 22.45 3.82 22.75 3.41 22.75Z" fill="currentColor"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Contribution Made</h4>
                        <p className="text-xs text-gray-500">
                          {new Date(contribution.created_at).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className={`${badgeClass} text-xs px-2 py-0.5 rounded mb-1`}>
                        {badgeText}
                      </div>
                      <p className="text-sm font-semibold">{formatCurrency(contribution.amount)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          <button className="w-full text-center text-sm text-teal-700 mt-6 py-2 border border-gray-200 rounded-md hover:bg-gray-50">
            View all
          </button>
        </>
      )}
      
      {activeTab === 'payouts' && (
        <div className="py-8 text-center">
          <p className="text-gray-500">Payout history will be displayed here</p>
        </div>
      )}
      
      {activeTab === 'members' && (
        <div className="space-y-4 mt-6">
          {groupData.members.length > 0 ? (
            groupData.members.map((member) => {
              const { user, role, status } = member
              const isAdmin = role === 'admin'
              const badgeClass = isAdmin
                ? "bg-purple-100 text-purple-800"
                : "bg-gray-100 text-gray-800"

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between border-b pb-3"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <span className="text-gray-600 font-medium uppercase">
                        {user?.full_name?.charAt(0)}
                      </span>
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-medium">{user.full_name || user.username}</h4>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className={`${badgeClass} text-xs px-2 py-0.5 rounded mb-1 capitalize`}>
                      {role}
                    </div>
                    <div
                      className={`text-xs px-2 py-0.5 rounded ${
                        status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {status}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">No members have joined this group yet.</p>
            </div>
          )}
        </div>
      )}

      </div>
  );
};


// Group Rules Component
export function GroupRules({ rules }: { rules: iGroupRule[] }) {
  return (
    <div className="bg-white rounded-md p-4">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-base font-medium mb-1">Group Rules</h2>
          <p className="text-xs text-gray-500">
            These are the rules set for your group to keep things fair and organized.
          </p>
        </div>
      </div>
      
      <div className="space-y-4 mt-3">
        {rules.map((rule: iGroupRule, index) => (
          
            <div key={rule.description} className="border-l-4 border-blue-500 pl-3 py-1">
              <h3 className="text-sm font-medium mb-1">Rule {index + 1}: {rule.title}</h3>
              <p className="text-xs text-gray-600">{rule.description}</p>
            </div>
            ))
        }
        
      </div>
    </div>
)
}
  


export default function GroupDetailsView({ groupId }: GroupDetailsViewProps) {
  const [groupData, setGroupData] = useState<GroupDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Log the group ID for testing
  useEffect(() => {
    console.log(`GroupDetailsView initialized with groupId: ${groupId}`);
    // For testing specific group IDs like "ad75064d-591a-451e-8a75-508713ffc978"
  }, [groupId]);
  
  // Fetch group data when component mounts
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Test specific group ID: ad75064d-591a-451e-8a75-508713ffc978
        // This logs the ID to console but uses the actual groupId param for the API call
        console.log(`Fetching group details for: ${groupId}`);
        
        const data = await GroupService.getGroupExtDetails(groupId);
        
        if (data) {
          // Calculate additional UI fields
          const nextContribution = getNextContributionDate(data.contribution_frequency);
          
          // Enhance the data with UI-specific fields
          const enhancedData: GroupDetails = {
            ...data,
            nextContribution: {
              amount: data.contribution_amount.amount,
              ...nextContribution
            },
            nextPayout: {
              amount: data.next_payout.amount, // Simplified calculation
              recipient: data.next_payout.recipient || 'Adams Olive', // Mock data
              date: data.next_payout.recipient || 'June 16, 2025'  // Mock data
            },
            totalSaved: data.total_saved || 0, 
            progress: data.progress || 1, 
            memberCount: data.members_count || 1 
          };
          
          setGroupData(enhancedData);
        } else {
          setError('Group not found');
        }
      } catch (err) {
        console.error('Error fetching group details:', err);
        setError('Failed to load group details');
        toast({
          title: "Error",
          description: "Failed to load group details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGroupData();
  }, [groupId]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-700 mb-4" />
        <p className="text-gray-600">Loading group details...</p>
          </div>
    );
  }
  
  // Show error state
  if (error || !groupData) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">Group not found</h2>
        <p className="text-gray-600 mb-4">{error || "The group you're looking for doesn't exist."}</p>
        <Link href="/dashboard/my-group">
          <Button className="bg-teal-700 hover:bg-teal-800 text-white">
            Back to My Groups
          </Button>
        </Link>
        </div>
    );
  }

  const rules = groupData.rules
  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Group Header Component */}
      <GroupHeader 
        name={groupData.name} 
        description={groupData.description || `${groupData.name} Cooperative Group`}
        groupId={groupId}
      />
      
      {/* Group Stats Component */}
      <GroupStats 
        groupData={groupData}
        memberCount={groupData.memberCount || 10}
        totalSaved={groupData.totalSaved || 0}
        progress={groupData.progress || 0}
        targetAmount={groupData.target_amount || 0}
        contributionAmount={groupData.contribution_amount || 9999}
        contributionDueDate={`${groupData.nextContribution?.daysLeft}` || "May 25"}
        contributionDaysLeft={10}
        contributionFrequency={groupData.contribution_frequency || "Monthly"}
        payoutAmount={groupData.nextPayout?.amount || 300000}
        payoutRecipient={groupData.nextPayout?.recipient || "Adams Olive"}
        payoutDate={groupData.nextPayout?.date || "June 16, 2025"}
      />

      {/* Lower sections in flex column */}
      <div className="flex flex-col gap-6">
        {/* Contribution History Component */}
          <ContributionHistory groupData={groupData} />
        {/* <ContributionHistory contributions={groupData.contributions} /> */} 

        {/* Group Rules Component */}
        <GroupRules rules={rules} />

        <div className="flex justify-end mb-8">
          <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
            Leave Group
          </Button>
        </div>
      </div>
    </div>
  )
} 