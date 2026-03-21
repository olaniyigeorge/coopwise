"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import GroupService from '@/lib/group-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Check, AlertTriangle, Users, ArrowRight } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function JoinGroupPage({ params }: { params: Promise<{ code: string }> }) {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [isJoining, setIsJoining] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [groupData, setGroupData] = useState<any>(null)
  const [isLoadingGroup, setIsLoadingGroup] = useState(true)

  const [inviteCode, setInviteCode] = useState<string>('')

  // Extract invite code from params
  useEffect(() => {
    const extractCode = async () => {
      const { code } = await params
      setInviteCode(code)
    }
    extractCode()
  }, [params])

  // Check if user is authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Store the invite code and redirect to login
      localStorage.setItem('pendingInviteCode', inviteCode)
      router.push(`/auth/login?returnUrl=${encodeURIComponent(`/invite/${inviteCode}/join`)}`)
      return
    }

    if (isAuthenticated && user) {
      // User is authenticated, fetch group details and check pending invites
      fetchGroupDetails()
      checkPendingInvites()
    }
  }, [loading, isAuthenticated, user, inviteCode, router, fetchGroupDetails, checkPendingInvites])

  const fetchGroupDetails = useCallback(async () => {
    try {
      setIsLoadingGroup(true)
      const response = await fetch(`/api/groups/public/invite/${inviteCode}`)
      if (response.ok) {
        const data = await response.json()
        setGroupData(data)
      }
    } catch (error) {
      console.error('Error fetching group details:', error)
    } finally {
      setIsLoadingGroup(false)
    }
  }, [inviteCode])

  const checkPendingInvites = useCallback(() => {
    // Check if there's a pending invite from localStorage
    const pendingInvite = localStorage.getItem('pendingInviteCode')
    
    if (pendingInvite === inviteCode) {
      // Clear the pending invite
      localStorage.removeItem('pendingInviteCode')
      localStorage.removeItem('pendingGroupName')
    }
  }, [inviteCode])

  const handleJoinGroup = async () => {
    try {
      setIsJoining(true)
      setErrorMessage('')
      
      // Join the group using the invite code
      await GroupService.acceptInviteCode(inviteCode)
      
      // Show success
      setJoinSuccess(true)
      toast({
        title: "Successfully joined!",
        description: `You are now a member of ${groupData?.name || 'this group'}`,
      })
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push('/dashboard?tab=my')
      }, 2000)
      
    } catch (error: any) {
      console.error('Error joining group:', error)
      setErrorMessage(error.message || 'Failed to join group. Please try again.')
      toast({
        title: "Error",
        description: error.message || 'Failed to join group. Please try again.',
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard?tab=my')
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading while fetching group details
  if (isLoadingGroup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading group details...</p>
        </div>
      </div>
    )
  }

  // Show error if group not found
  if (!groupData || !groupData.exists) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Invalid Invite Link</CardTitle>
            <CardDescription>
              This invite link appears to be invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Join Group</h1>
            <Button variant="outline" onClick={handleGoToDashboard}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Join {groupData.name || 'this group'}</CardTitle>
            <CardDescription>
              {joinSuccess 
                ? "You've successfully joined the group!"
                : "You're about to join this savings group."
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {isJoining ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-600">Processing your request...</p>
              </div>
            ) : joinSuccess ? (
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-base font-medium text-gray-900 mb-2">Successfully joined!</p>
                <p className="text-sm text-gray-600 mb-6">
                  You are now a member of {groupData.name || 'this group'}. Redirecting to your dashboard...
                </p>
                <Button onClick={handleGoToDashboard} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            ) : errorMessage ? (
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-base font-medium text-gray-900 mb-2">Something went wrong</p>
                <p className="text-sm text-gray-600 mb-6">{errorMessage}</p>
                <Button onClick={handleJoinGroup} variant="outline" className="w-full">
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                {/* Group Summary */}
                {groupData.name && (
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h3 className="font-medium text-gray-900 mb-2">Group Summary</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Name:</strong> {groupData.name}</p>
                      {groupData.description && (
                        <p><strong>Description:</strong> {groupData.description}</p>
                      )}
                      {groupData.contribution_amount && (
                        <p><strong>Contribution:</strong> ₦{new Intl.NumberFormat().format(groupData.contribution_amount)}</p>
                      )}
                      {groupData.contribution_frequency && (
                        <p><strong>Frequency:</strong> {groupData.contribution_frequency}</p>
                      )}
                      {groupData.memberCount && (
                        <p><strong>Members:</strong> {groupData.memberCount}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Join Confirmation */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Ready to join {groupData.name || 'this group'}?
                      </p>
                      <p className="text-xs text-gray-600">
                        By joining, you&apos;ll be able to participate in group savings and contribute according to the group&apos;s rules.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleJoinGroup}
                    disabled={isJoining}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        Join Group
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleGoToDashboard}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
