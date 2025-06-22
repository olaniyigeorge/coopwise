"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import GroupService from '@/lib/group-service'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Check, UserCheck, AlertTriangle } from 'lucide-react'

interface InviteJoinHandlerProps {
  inviteCode: string
  groupName: string
}

export default function InviteJoinHandler({ inviteCode, groupName }: InviteJoinHandlerProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Handle the join button click
  const handleJoinClick = () => {
    // Open the dialog
    setShowJoinDialog(true)
  }
  
  // Handle user joining the group
  const handleJoinGroup = async () => {
    try {
      setIsJoining(true)
      setErrorMessage('')
      
      // If user is not logged in, redirect to login with returnUrl
      if (!isAuthenticated || !user) {
        // Store the invite code in local storage for after login
        localStorage.setItem('pendingInviteCode', inviteCode)
        localStorage.setItem('pendingGroupName', groupName)
        
        // Redirect to login page with return URL to join page
        router.push(`/auth/login?returnUrl=${encodeURIComponent(`/invite/${inviteCode}`)}`)
        return
      }
      
      // User is logged in, proceed with joining
      await GroupService.acceptInviteCode(inviteCode)
      
      // Show success and set timeout to redirect
      setJoinSuccess(true)
      
      // Redirect to group view after a delay
      setTimeout(() => {
        router.push('/dashboard?tab=my')
      }, 2000)
      
    } catch (error: any) {
      console.error('Error joining group:', error)
      setErrorMessage(error.message || 'Failed to join group. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }
  
  // Handle redirection for already logged in users with pending invites
  useEffect(() => {
    // Check if there's a pending invite from localStorage
    const pendingInvite = localStorage.getItem('pendingInviteCode')
    
    if (isAuthenticated && user && pendingInvite === inviteCode) {
      // Clear the pending invite
      localStorage.removeItem('pendingInviteCode')
      localStorage.removeItem('pendingGroupName')
      
      // Open the join dialog automatically
      setShowJoinDialog(true)
    }
  }, [isAuthenticated, user, inviteCode])
  
  const handleViewLater = () => {
    setShowJoinDialog(false)
    // Redirect to dashboard
    router.push('/dashboard')
  }
  
  return (
    <>
      <Button 
        className="flex-1 inline-flex justify-center items-center rounded-md bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary/90 transition"
        onClick={handleJoinClick}
      >
        Join Group
      </Button>
      
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Join {groupName}</DialogTitle>
            <DialogDescription>
              {isAuthenticated
                ? "You're about to join this savings group."
                : "You'll need to log in or create an account to join this group."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isJoining ? (
              <div className="flex flex-col items-center justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-sm text-gray-600">Processing your request...</p>
              </div>
            ) : joinSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p className="mt-4 text-base font-medium text-gray-900">Successfully joined!</p>
                <p className="mt-2 text-sm text-gray-600">
                  You are now a member of {groupName}. Redirecting to your dashboard...
                </p>
              </div>
            ) : errorMessage ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <p className="mt-4 text-base font-medium text-gray-900">Something went wrong</p>
                <p className="mt-2 text-sm text-gray-600">{errorMessage}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-md bg-primary/5 border border-primary/20">
                  <UserCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {isAuthenticated
                        ? `Ready to join ${groupName}?`
                        : "You'll need an account to join"}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {isAuthenticated
                        ? "Click continue to join this group now."
                        : "Log in or create an account to proceed."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-3">
            {!joinSuccess && (
              <>
                {isAuthenticated ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowJoinDialog(false)}
                      disabled={isJoining}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleJoinGroup}
                      disabled={isJoining}
                    >
                      {isJoining ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        "Join Group"
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowJoinDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleJoinGroup}
                    >
                      Log in to Join
                    </Button>
                  </>
                )}
              </>
            )}
            
            {joinSuccess && (
              <div className="flex justify-center sm:justify-end w-full">
                <Button
                  type="button"
                  onClick={handleViewLater}
                >
                  Go to Dashboard
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 