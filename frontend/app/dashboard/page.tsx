"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import DashboardLayout from '@/components/dashboard/layout'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import GroupsTabView from '@/components/dashboard/groups-tab-view'

export default function Dashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  // Extract user's first name
  const firstName = user?.full_name?.split(' ')[0] || 'User'
  
    // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null // Don't render anything while redirecting
  }

  return (
    <DashboardLayout>
      <div className='flex justify-between w-full'>
        
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold">
          Welcome, {firstName}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500">Here's an overview of your savings</p>
      </div>

      {/* Top buttons - hide on mobile */}
      <div className="hidden md:flex justify-end mb-6 space-x-3">
            <Button 
          variant="default" 
          className="bg-primary hover:bg-primary/90"
            >
              Join a Group
            </Button>
        <Button 
          variant="outline" 
          className="border-primary text-primary hover:bg-primary hover:text-white"
          onClick={() => router.push('/dashboard/create-group')}
        >
              Create a Group
            </Button>
          </div>
      </div>
    

          {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="text-gray-500 text-sm mb-2">Your savings</h3>
              <div className="text-2xl font-bold">₦0</div>
              <div className="text-gray-500 text-xs mt-1">Total saved across all groups</div>
              <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>0%</span>
            </div>
                <div className="relative w-full h-1.5 bg-gray-100 rounded-full">
                  <div className="absolute left-0 top-0 h-full bg-primary rounded-full" style={{ width: '0%' }}></div>
                </div>
            <div className="text-xs text-gray-500 mt-1">Goal: ₦800,000.00</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="text-gray-500 text-sm mb-2">Next Contribution</h3>
          <div className="flex items-start mt-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Image 
                src="/assets/icons/fluent_people-community-48-regular (1).svg" 
                alt="Group Icon" 
                width={20} 
                height={20} 
              />
            </div>
            <div className="ml-3">
              <div className="text-base font-medium">No upcoming contribution</div>
              <div className="text-gray-500 text-xs mt-1">Create a group or join an existing one to start saving together</div>
            </div>
          </div>
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="text-gray-500 text-sm mb-2">Next Payout</h3>
          <div className="flex items-start mt-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Image 
                src="/assets/icons/fluent_people-community-48-regular (1).svg" 
                alt="Group Icon" 
                width={20} 
                height={20} 
              />
            </div>
            <div className="ml-3">
              <div className="text-base font-medium">No payout yet!</div>
              <div className="text-gray-500 text-xs mt-1">You'll see your payout date here after joining a group</div>
            </div>
          </div>
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="text-gray-500 text-sm mb-2">Payout Number</h3>
          <div className="flex items-start mt-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Image 
                src="/assets/icons/fluent_people-community-48-regular (1).svg" 
                alt="Group Icon" 
                width={20} 
                height={20} 
              />
            </div>
            <div className="ml-3">
              <div className="text-base font-medium">Not assigned yet!</div>
              <div className="text-gray-500 text-xs mt-1">Join or create a group to get a payout number</div>
            </div>
          </div>
            </div>
          </div>

      {/* Main content in two columns on desktop, one column on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left column - takes 2/3 on desktop */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Groups Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-0">
              <GroupsTabView defaultTab="discover" />
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-5">
            <h2 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Recent Activity</h2>
            
            <div className="text-center py-4 sm:py-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Image 
                  src="/assets/icons/fluent_people-community-48-regular (1).svg" 
                  alt="Activity Icon" 
                  width={20} 
                  height={20}
                  className="sm:w-6 sm:h-6"
                />
                </div>
              <h3 className="text-sm sm:text-base font-medium mb-1">No activity to show</h3>
              <p className="text-xs sm:text-sm text-gray-500 px-2">
                You don't have any transactions and updates. Create a
                group or join an existing one to start saving together
              </p>
                    </div>
                    </div>
                  </div>

        {/* Right column - takes 1/3 on desktop */}
        <div className="space-y-4 sm:space-y-6">
          {/* Savings Goal Section */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-5">
            <h2 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Savings Goal</h2>
            
            <div className="mb-3 sm:mb-4">
              <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
                <span>House Rent: ₦0.00 of ₦500,000</span>
              </div>

              <div className="w-full h-2 bg-gray-100 rounded-full mb-2">
                <div className="h-full bg-primary rounded-full w-0"></div>
                </div>

              <div className="flex justify-between text-xs sm:text-sm">
                <span>0% complete</span>
                <span>₦500,000 to go</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full border-primary text-primary hover:bg-primary hover:text-white text-sm sm:text-base"
            >
              Update Goal
            </Button>
          </div>

          {/* AI Insights Section */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-5">
            <h2 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">AI Insights</h2>
            
            <div className="text-center py-4 sm:py-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Image 
                  src="/assets/icons/fluent_people-community-48-regular (1).svg" 
                  alt="AI Icon" 
                  width={20} 
                  height={20}
                  className="sm:w-6 sm:h-6"
                />
              </div>
              <h3 className="text-sm sm:text-base font-medium mb-1">No tips yet</h3>
              <p className="text-xs sm:text-sm text-gray-500 px-2">
                Join or create a savings group to start getting smart tips
                that help you stay on track.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 