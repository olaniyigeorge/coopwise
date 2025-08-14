"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/hooks/use-app-store'
import DashboardLayout from '@/components/dashboard/layout'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import GroupsTabView from '@/components/dashboard/groups-tab-view'
import { getDashboardData, DashboardData, defDashData, AIInsightDetail } from '@/lib/dashboard-service'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Bot, MessageSquare, Sparkles } from 'lucide-react'
import AIInsightCard from '@/components/dashboard/ai-insight-card'
import { formatDate } from '@/lib/contribution-utils'
import RecentActivities from '@/components/dashboard/recent-activities'
// import { formatDate } from '@/lib/insight-utils'

export default function Dashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData>(defDashData)

  // Extract user's first name
  const firstName = user?.full_name?.split(' ')[0] || 'User'

 
  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      console.log(`\n Fetching dashboardData ${isAuthenticated} \n`)
      if (isAuthenticated) {
        try {
          const data = await getDashboardData()
                   
          // Ensure the data has the expected structure
          const processedData: DashboardData = data
          // console.log('Setting Dashboard data:::', data)          
          setDashboardData(processedData)
        } catch (error) {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
          console.error('Error fetching dashboard data:', error)
        } finally {
          setLoading(false)
        }
      }
    }
    
    fetchData()
  }, [isAuthenticated])
  




  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router, loading])

  if (!isAuthenticated && !loading) {
    return null // Don't render anything while redirecting
  }

  // Safely access nested properties with nullish coalescing
const savingsTotal = dashboardData?.summary?.your_savings ?? 0;
const savingsGoal = dashboardData?.user?.target_savings_amount ?? 0;

const savingsProgress = savingsGoal > 0
  ? (savingsTotal / savingsGoal)*100
  : 0;

const walletBalance = dashboardData?.summary?.wallet?.stable_coin_balance ?? 0;

const hasUpcomingContribution = !!dashboardData?.summary?.next_contribution;
const hasUpcomingPayout = !!dashboardData?.summary?.next_payout;

const groupGoals = dashboardData?.targets?.group_goals ?? [];
const firstGroupGoal = groupGoals[0] ?? {};

const savingsGoalName = firstGroupGoal.name ?? '';
const savingsGoalCurrent = firstGroupGoal.target_amount ?? 0;
const savingsGoalTarget = dashboardData?.targets?.savings_target ?? 0;

const ssg = dashboardData?.user?.target_savings_amount ?? 0;
const sst = dashboardData?.summary?.your_savings ?? 0;

const savingsGoalProgress = ssg > 0 ? (sst / ssg)*100 : 0;
const savingsGoalRemaining = ssg - sst;

const recentActivity = dashboardData?.activities ?? [];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold">
            Welcome, {firstName}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">Here&apos;s an overview of your savings</p>
        </div>

        {/* Top buttons - hide on mobile */}
        <div className="hidden md:flex justify-end mb-6 space-x-3">
          <Button 
            variant="default" 
            className="bg-primary hover:bg-primary/90"
            onClick={() => router.push('/dashboard/join-group')}>
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
          <div className="text-2xl font-bold">{formatCurrency(savingsTotal)}</div>
          <div className="text-gray-500 text-xs mt-1">Total saved across all groups</div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{savingsProgress}%</span>
            </div>
            <div className="relative w-full h-1.5 bg-gray-100 rounded-full">
              <div 
                className="absolute left-0 top-0 h-full bg-primary rounded-full" 
                style={{ width: `${savingsProgress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">Goal: {formatCurrency(savingsGoal)}</div>
          </div>
        </div>

        {/* {formatCurrency(walletBalance)} */}

        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-gray-500 text-sm mb-2">Your Wallet</h3>
          <div className="items-start justify-between">
            <div className="text-2xl font-bold w-full"><span className="text-xl tracking-tighter">USDC</span>  {Number(walletBalance || 0).toFixed(2)}</div> 
            <div className="text-xs font-medium">{formatCurrency((walletBalance || 0)*(1600))}</div> 
          </div>
          <div className="text-gray-500 text-xs mt-1">Balance available in your wallet for contributions</div>
          <div className="mt-4">
            <Button 
              variant="default" 
              className="bg-primary hover:bg-primary/90 text-xs w-full"
              onClick={() => router.push('/dashboard/wallet/fund')}
            >
              Add Money
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-gray-500 text-sm mb-2">Next Contribution</h3>
          <div className="flex items-start mt-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center relative">
              <Image 
                src="/assets/icons/fluent_people-community-48-regular (1).svg" 
                alt="Group Icon" 
                width={20} 
                height={20} 
              />
            </div>
            <div className="ml-3">
              {hasUpcomingContribution ? (
                <>
                  <div className="text-base font-medium">{formatDate(dashboardData?.summary.next_contribution || "")}</div>
                  <div className="text-gray-500 text-xs mt-1">
                  {formatDate(dashboardData?.summary.next_contribution || "")}
                    {/* {formatCurrency(dashboardData?.nextContribution?.amount || 0)} due on {new Date(dashboardData?.nextContribution?.dueDate || '').toLocaleDateString()} */}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-base font-medium">No upcoming contribution</div>
                  <div className="text-gray-500 text-xs mt-1">Create a group or join an existing one to start saving together</div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-gray-500 text-sm mb-2">Next Payout</h3>
          <div className="flex items-start mt-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center relative">
              <Image 
                src="/assets/icons/fluent_people-community-48-regular (1).svg" 
                alt="Group Icon" 
                width={20} 
                height={20} 
              />
            </div>
            <div className="ml-3">
              {hasUpcomingPayout ? (
                <>
                  <div className="text-base font-medium">{dashboardData?.summary?.next_payout}</div>
                  <div className="text-gray-500 text-xs mt-1">
                  {dashboardData?.summary?.next_payout}
                    {/* {formatCurrency(dashboardData?.nextPayout?.amount || 0)} on {new Date(dashboardData?.nextPayout?.dueDate || '').toLocaleDateString()} */}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-base font-medium">No payout yet!</div>
                  <div className="text-gray-500 text-xs mt-1">You&apos;ll see your payout date here after joining a group</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content in two columns on desktop, one column on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 ">
        {/* Left column - takes 2/3 on desktop */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Groups Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-0">
              <GroupsTabView defaultTab="discover" />
            </div>
          </div>

          {/* Recent Activity Section */}
          <RecentActivities 
            activities={recentActivity} 
            currentUserId={user?.id}
          />
        </div>

        {/* Right column - takes 1/3 on desktop */}
        <div className="space-y-4 sm:space-y-6">
          {/* Savings Goal Section */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-5">
            <h2 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Savings Goal</h2>
            
            <div className="mb-3 sm:mb-4">
              <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
                <span>{savingsGoalName}: {formatCurrency(savingsGoalCurrent)} of {formatCurrency(savingsGoalTarget)}</span>
              </div>

              <div className="w-full h-2 bg-gray-100 rounded-full mb-2">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${savingsGoalProgress}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-xs sm:text-sm">
                <span>{savingsGoalProgress}% complete</span>
                <span>{formatCurrency(savingsGoalRemaining)} to go</span>
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

          {/* AI Chat Assistant Section */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-sm sm:text-base font-semibold flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                AI Financial Assistant
              </h2>
            </div>
            
            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-4 mb-4">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-1">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm mb-2">
                    Get personalized financial advice and answers to your savings questions instantly.
                  </p>
                  <p className="text-xs text-gray-500">
                    Ask about budgeting, savings strategies, debt management, and more.
                  </p>
                </div>
              </div>
                  </div>
            
            <div className="space-y-2 mb-4">
              <div className="text-xs font-medium text-gray-500">Popular questions:</div>
              <div className="bg-gray-50 rounded p-2 text-xs">
                &ldquo;How can I save ₦100,000 in 3 months?&rdquo;
              </div>
              <div className="bg-gray-50 rounded p-2 text-xs">
                &ldquo;What&apos;s the best way to manage my debt?&rdquo;
              </div>
              <div className="bg-gray-50 rounded p-2 text-xs">
                &ldquo;How should I budget my monthly income?&rdquo;
              </div>
            </div>
            
            <Link href="/dashboard/ai-chat">
              <Button 
                variant="default" 
                className="w-full flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Chat with AI Assistant
              </Button>
            </Link>
          </div>
          {/* AI Insights Section */}
          <div className="bg-white rounded-lg  shadow p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-sm sm:text-base font-semibold flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-secondary" />
                AI Insights
              </h2>
            </div>
            <div className="flex-col items-center space-y-4">
              {dashboardData.ai_insights.slice(0,3).map((insight: AIInsightDetail) => (
                <AIInsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 


