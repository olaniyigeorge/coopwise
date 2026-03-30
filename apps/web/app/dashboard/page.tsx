"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/hooks/use-app-store'
import DashboardLayout from '@/components/dashboard/layout'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import GroupsTabView from '@/components/dashboard/groups-tab-view'
import { getDashboardData, DashboardData, defDashData, AIInsightDetail } from '@/lib/dashboard-service'
import { formatCurrency, getActivityDescription } from '@/lib/utils'
import Link from 'next/link'
import { Bot, MessageSquare, Sparkles, Plus, Users, TrendingUp, ArrowUpRight } from 'lucide-react'
import AIInsightCard from '@/components/dashboard/ai-insight-card'
import { formatDate } from '@/lib/contribution-utils'

export default function Dashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData>(defDashData)

  const firstName = user?.full_name?.split(' ')[0] || 'User'

  useEffect(() => {
    const fetchData = async () => {
      if (isAuthenticated) {
        try {
          const data = await getDashboardData()
          setDashboardData(data)
        } catch (error) {
          console.error('Error fetching dashboard data:', error)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchData()
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router, loading])

  if (!isAuthenticated && !loading) return null

  // Derived values
  const savingsTotal = dashboardData?.summary?.your_savings ?? 0
  const savingsGoal = dashboardData?.user?.target_savings_amount ?? 0
  const savingsProgress = savingsGoal > 0 ? Math.min((savingsTotal / savingsGoal) * 100, 100) : 0
  const walletBalance = dashboardData?.summary?.wallet?.stable_coin_balance ?? 0
  const hasUpcomingContribution = !!dashboardData?.summary?.next_contribution
  const hasUpcomingPayout = !!dashboardData?.summary?.next_payout

  const groupGoals = dashboardData?.targets?.group_goals ?? []
  const firstGroupGoal = groupGoals[0] ?? {}
  const savingsGoalName = firstGroupGoal.name ?? ''

  const ssg = dashboardData?.user?.target_savings_amount ?? 0
  const sst = dashboardData?.summary?.your_savings ?? 0
  const savingsGoalProgress = ssg > 0 ? Math.min((sst / ssg) * 100, 100) : 0
  const savingsGoalRemaining = Math.max(ssg - sst, 0)

  const recentActivity = dashboardData?.activities ?? []

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Here's an overview of your savings</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-200 text-gray-700 hover:border-primary hover:text-primary gap-1.5"
              onClick={() => router.push('/dashboard/join-group')}
            >
              <Users className="w-3.5 h-3.5" />
              Join Group
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => router.push('/dashboard/create-circle')}
            >
              <Plus className="w-3.5 h-3.5" />
              Create Group
            </Button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Your Savings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Your Savings</span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(savingsTotal)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Across all groups</p>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Progress to goal</span>
                <span className="font-medium text-gray-700">{savingsProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${savingsProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Goal: {formatCurrency(savingsGoal)}</p>
            </div>
          </div>

          {/* Wallet */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Wallet Balance</span>
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                <span className="text-base font-semibold text-gray-400 mr-1">USDC</span>
                {Number(walletBalance || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">≈ {formatCurrency((walletBalance || 0) * 1600)}</p>
            </div>
            <Button
              size="sm"
              className="w-full gap-1.5 mt-auto"
              onClick={() => router.push('/dashboard/wallet/fund')}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Money
            </Button>
          </div>

          {/* Next Contribution */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Next Contribution</span>
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            {hasUpcomingContribution ? (
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {formatDate(dashboardData?.summary.next_contribution || '')}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Upcoming due date</p>
              </div>
            ) : (
              <div>
                <p className="text-base font-semibold text-gray-700">Nothing scheduled</p>
                <p className="text-xs text-gray-400 mt-0.5">Join a group to start saving together</p>
              </div>
            )}
          </div>

          {/* Next Payout */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Next Payout</span>
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              </div>
            </div>
            {hasUpcomingPayout ? (
              <div>
                <p className="text-lg font-bold text-gray-900">{dashboardData?.summary?.next_payout}</p>
                <p className="text-xs text-gray-400 mt-0.5">Expected payout date</p>
              </div>
            ) : (
              <div>
                <p className="text-base font-semibold text-gray-700">No payout yet</p>
                <p className="text-xs text-gray-400 mt-0.5">Your payout date appears after joining a group</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Main Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — Groups + Activity */}
          <div className="lg:col-span-2 space-y-6">

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <GroupsTabView defaultTab="discover" />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h2>

              {recentActivity.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {recentActivity.map((activity) => {
                    const isOwnActivity = activity.user_id === user?.id
                    return (
                      <div key={activity.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <Image
                            src="/assets/icons/fluent_people-community-48-regular (1).svg"
                            alt="Activity"
                            width={16}
                            height={16}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">
                            {getActivityDescription(activity, isOwnActivity)}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(activity.created_at).toLocaleDateString('en-NG', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <Image
                      src="/assets/icons/fluent_people-community-48-regular (1).svg"
                      alt="No activity"
                      width={22}
                      height={22}
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-700">No activity yet</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
                    Create or join a group to see your transactions here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right — Savings Goal + AI */}
          <div className="space-y-6">

            {/* Savings Goal */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Savings Goal</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary h-7 px-2 hover:bg-primary/5"
                  onClick={() => router.push('/dashboard/profile?focus=savings-goal')}
                >
                  Edit
                </Button>
              </div>

              {ssg > 0 ? (
                <>
                  {savingsGoalName && (
                    <p className="text-xs text-gray-400 mb-2 truncate">{savingsGoalName}</p>
                  )}
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(sst)}</span>
                    <span className="text-xs text-gray-400">of {formatCurrency(ssg)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${savingsGoalProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-2 text-gray-500">
                    <span>{savingsGoalProgress.toFixed(0)}% complete</span>
                    <span>{formatCurrency(savingsGoalRemaining)} left</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 border-gray-200 text-gray-600 hover:border-primary hover:text-primary text-xs"
                    onClick={() => router.push('/dashboard/profile?focus=savings-goal')}
                  >
                    Update Goal
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">No savings goal set yet.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-primary text-primary hover:bg-primary hover:text-white text-xs w-full"
                    onClick={() => router.push('/dashboard/profile?focus=savings-goal')}
                  >
                    Set a Goal
                  </Button>
                </div>
              )}
            </div>

            {/* AI Chat Assistant */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-gray-900">AI Financial Assistant</h2>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-50 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Get personalized financial advice — budgeting tips, savings strategies, and more.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                <p className="text-xs font-medium text-gray-400 mb-2">Try asking:</p>
                {[
                  'How can I save ₦100,000 in 3 months?',
                  "What's the best way to manage my debt?",
                  'How should I budget my monthly income?',
                ].map((q) => (
                  <div
                    key={q}
                    className="bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2 text-xs text-gray-600 cursor-pointer transition-colors border border-transparent hover:border-indigo-100"
                  >
                    &ldquo;{q}&rdquo;
                  </div>
                ))}
              </div>

              <Link href="/dashboard/ai-chat">
                <Button size="sm" className="w-full gap-2">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Chat with AI Assistant
                </Button>
              </Link>
            </div>

            {/* AI Insights */}
            {(dashboardData.ai_insights?.length ?? 0) > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <h2 className="text-sm font-semibold text-gray-900">AI Insights</h2>
                </div>
                <div className="space-y-3">
                  {dashboardData.ai_insights.slice(0, 3).map((insight: AIInsightDetail) => (
                    <AIInsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile CTA buttons */}
        <div className="flex md:hidden gap-3">
          <Button
            variant="outline"
            className="flex-1 border-primary text-primary hover:bg-primary hover:text-white"
            onClick={() => router.push('/dashboard/join-group')}
          >
            Join a Group
          </Button>
          <Button
            className="flex-1"
            onClick={() => router.push('/dashboard/create-circle')}
          >
            Create a Group
          </Button>
        </div>

      </div>
    </DashboardLayout>
  )
}