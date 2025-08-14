"use client"

import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import AIInsightsSummary from './ai-insights-summary'
import DashboardGroupsSection from './dashboard-groups-section'

// Stats card component
const StatsCard = ({ 
  title, 
  children
}: { 
  title: string; 
  children: React.ReactNode
}) => (
  <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-5 flex flex-col justify-between">
    <h3 className="text-xs sm:text-sm text-gray-500">{title}</h3>
    <div className="mt-2 sm:mt-3">
      {children}
    </div>
  </div>
)

export default function DashboardOverview() {
  const router = useRouter()

  return (
    <div>
      {/* Welcome section with action buttons */}
      <div className="flex flex-col space-y-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Welcome, Mercy</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Here&apos;s an overview of your savings</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button 
            variant="default" 
            className="font-medium text-sm sm:text-base"
            onClick={() => window.location.href = '/dashboard/contributions/make/loading?amount=50000'}
          >
            Make Contribution
          </Button>
          <Button 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary hover:text-white text-sm sm:text-base"
            onClick={() => router.push('/dashboard/create-group')}
          >
            Create a Group
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
        {/* Your Savings */}
        <StatsCard title="Your savings" icon="/assets/icons/piggy-bank.svg">
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-semibold text-gray-800">₦0</span>
            <span className="text-xs text-gray-500 mt-1">Total saved across all groups</span>
          </div>
          
          <div className="mt-3 sm:mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>0%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full">
              <div className="h-full bg-primary rounded-full w-0"></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">Goal: ₦500,000.00</div>
          </div>
        </StatsCard>
        
        {/* Next Contribution */}
        <StatsCard title="Next Contribution" icon="/assets/icons/calendar.svg">
          <div className="flex items-start sm:items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Image 
                src="/assets/icons/fluent_people-community-48-regular (1).svg" 
                alt="" 
                width={20} 
                height={20}
                className="sm:w-6 sm:h-6"
              />
            </div>
            <div className="ml-2 sm:ml-3 min-w-0">
              <h4 className="text-sm sm:text-base font-medium">No upcoming contribution</h4>
              <p className="text-xs text-gray-500 mt-1">
                Create a group or join an existing one to start saving together
              </p>
            </div>
          </div>
        </StatsCard>
        
        {/* Next Payout */}
        <StatsCard title="Next Payout" icon="/assets/icons/money.svg">
          <div className="flex items-start sm:items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Image 
                src="/assets/icons/fluent_people-community-48-regular (1).svg" 
                alt="" 
                width={20} 
                height={20}
                className="sm:w-6 sm:h-6"
              />
            </div>
            <div className="ml-2 sm:ml-3 min-w-0">
              <h4 className="text-sm sm:text-base font-medium">No payout yet!</h4>
              <p className="text-xs text-gray-500 mt-1">
                You&apos;ll see your payout date here after joining a group
              </p>
            </div>
          </div>
        </StatsCard>
        
        {/* Payout Number */}
        <StatsCard title="Payout Number" icon="/assets/icons/number.svg">
          <div className="flex items-start sm:items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Image 
                src="/assets/icons/fluent_people-community-48-regular (1).svg" 
                alt="" 
                width={20} 
                height={20}
                className="sm:w-6 sm:h-6"
              />
            </div>
            <div className="ml-2 sm:ml-3 min-w-0">
              <h4 className="text-sm sm:text-base font-medium">Not assigned yet!</h4>
              <p className="text-xs text-gray-500 mt-1">
                Join or create a group to get a payout number
              </p>
            </div>
          </div>
        </StatsCard>
        </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Groups Section - Using the new component */}
          <DashboardGroupsSection />
          
          {/* Recent Activity Section */}
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-5">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Recent Activity</h2>
            
            <div className="text-center py-6 sm:py-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Image 
                  src="/assets/icons/fluent_people-community-48-regular (1).svg" 
                  alt="" 
                  width={20} 
                  height={20}
                  className="sm:w-6 sm:h-6"
                />
              </div>
              <h3 className="text-sm sm:text-base font-medium mb-1">No activity to show</h3>
              <p className="text-xs sm:text-sm text-gray-500 px-2">
                You don&apos;t have any transactions and updates. Create a
                group or join an existing one to start saving together
              </p>
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Savings Goal Section */}
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-5">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Savings Goal</h2>
            
            <div className="mb-4 sm:mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm text-gray-600">House Rent: ₦0.00 of ₦500,000</span>
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
              onClick={() => router.push('/dashboard/profile?focus=savings-goal')}
            >
              Update Goal
            </Button>
          </div>
          
          {/* AI Insights Section - Using the updated component */}
          <div className="transform transition-all duration-300 hover:-translate-y-1">
            <AIInsightsSummary />
          </div>
        </div>
        </div>
    </div>
  )
} 