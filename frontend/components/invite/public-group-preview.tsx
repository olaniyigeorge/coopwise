"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Users, ArrowRight, Info, AlertCircle } from 'lucide-react'

interface PublicGroupPreviewProps {
  inviteCode: string
  groupData: any
}

export default function PublicGroupPreview({ inviteCode, groupData }: PublicGroupPreviewProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleJoinClick = () => {
    setIsLoading(true)
    
    // Store the invite code in localStorage for after login
    localStorage.setItem('pendingInviteCode', inviteCode)
    localStorage.setItem('pendingGroupName', groupData.name || 'this group')
    
    // Redirect to login page with return URL to join page
    router.push(`/auth/login?returnUrl=${encodeURIComponent(`/invite/${inviteCode}/join`)}`)
  }

  const handleSignUpClick = () => {
    setIsLoading(true)
    
    // Store the invite code in localStorage for after signup
    localStorage.setItem('pendingInviteCode', inviteCode)
    localStorage.setItem('pendingGroupName', groupData.name || 'this group')
    
    // Redirect to signup page with return URL to join page
    router.push(`/auth/signup?returnUrl=${encodeURIComponent(`/invite/${inviteCode}/join`)}`)
  }

  // If we don't have group data, show a generic message
  if (!groupData || !groupData.exists) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Invalid Invite Link</h3>
        <p className="text-gray-600 mb-6">
          This invite link appears to be invalid or has expired.
        </p>
        <Button
          onClick={() => router.push('/')}
          className="bg-primary hover:bg-primary/90"
        >
          Go to Homepage
        </Button>
      </div>
    )
  }

  // If we have limited group data (just the invite code), show a generic preview
  if (!groupData.name) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">You&apos;ve been invited!</h3>
        <p className="text-gray-600 mb-6">
          Someone has invited you to join a savings group on CoopWise. 
          Sign in or create an account to see the group details and join.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleJoinClick}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            Sign In to Join
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            onClick={handleSignUpClick}
            disabled={isLoading}
            variant="outline"
          >
            Create Account
          </Button>
        </div>
      </div>
    )
  }

  // Show full group preview with available data
  return (
    <div className="space-y-6 overflow-hidden">
      {/* Group Info */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Group banner/header */}
        <div className="relative h-32 sm:h-40 bg-gradient-to-r from-primary/30 to-primary/10 flex items-center justify-center">
          {groupData.image_url ? (
            <Image
              src={groupData.image_url}
              alt={groupData.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center">
              <Image 
                src="/assets/icons/fluent_people-community-48-regular (1).svg"
                alt="Group"
                width={32}
                height={32}
                className="sm:w-10 sm:h-10"
              />
            </div>
          )}
          {/* Gradient overlay for text readability if there's an image */}
          {groupData.image_url && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40"></div>
          )}
          
          {/* Group name overlay on mobile */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:hidden">
            <h1 className="text-xl font-bold text-white drop-shadow-sm break-words">{groupData.name}</h1>
          </div>
        </div>
        
        {/* Group details */}
        <div className="p-4 sm:p-6">
          {/* Hide on mobile as we show it in the banner */}
          <h1 className="hidden sm:block text-2xl font-bold text-gray-900 mb-4 break-words">{groupData.name}</h1>
          
          {/* Member count */}
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <span className="ml-3 text-sm text-gray-600">
              {groupData.memberCount || 'Several'} members
              {groupData.max_members && ` • Max ${groupData.max_members}`}
            </span>
          </div>
          
          {/* Description */}
          {groupData.description && (
            <div className="mb-4">
              <h2 className="text-sm font-medium text-gray-900 mb-2">About this group</h2>
              <p className="text-sm text-gray-600">{groupData.description}</p>
            </div>
          )}
          
          {/* Group details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
            {groupData.contribution_amount && (
              <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                <h3 className="text-xs font-medium text-gray-700">Contribution</h3>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  ₦{new Intl.NumberFormat().format(groupData.contribution_amount)}
                </p>
              </div>
            )}
            
            {groupData.contribution_frequency && (
              <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                <h3 className="text-xs font-medium text-gray-700">Frequency</h3>
                <p className="mt-1 text-sm font-semibold text-gray-900 capitalize">
                  {groupData.contribution_frequency.toLowerCase()}
                </p>
              </div>
            )}
          </div>
          
          {/* Group rules */}
          {groupData.rules && groupData.rules.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-900 mb-3">Group Rules</h2>
              <div className="bg-gray-50 rounded-md p-3 sm:p-4 border border-gray-100">
                <ul className="space-y-2 sm:space-y-3">
                  {groupData.rules.slice(0, 3).map((rule: any, index: number) => (
                    <li key={index} className="flex">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-2 flex-shrink-0"></span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-800">{rule.title}</h4>
                        {rule.description && (
                          <p className="text-xs text-gray-600 mt-0.5">{rule.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                  {groupData.rules.length > 3 && (
                    <li className="text-xs text-gray-500 italic">
                      ...and {groupData.rules.length - 3} more rules
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Join CTA */}
      <div className="bg-white rounded-xl shadow-sm p-6 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to join {groupData.name}?</h3>
        <p className="text-gray-600 mb-6">
          You&apos;ll need to sign in or create an account to join this savings group and start saving together.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleJoinClick}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
          >
            Sign In to Join
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            onClick={handleSignUpClick}
            disabled={isLoading}
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            Create Account
          </Button>
        </div>
        
        <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
          <Info className="h-4 w-4 mr-2" />
          <span>Join over 10,000+ users already saving together on CoopWise</span>
        </div>
      </div>
    </div>
  )
}
