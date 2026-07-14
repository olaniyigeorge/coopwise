"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/hooks/use-app-store'
import DashboardLayout from '@/components/dashboard/layout'
import StatusBanner from '@/components/dashboard/status-banner'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import GroupsTabView from '@/components/dashboard/groups-tab-view'
import { getDashboardData, DashboardData, defDashData, AIInsightDetail } from '@/services/dashboard-service'
import { formatCurrency, getActivityDescription } from '@/lib/utils'
import Link from 'next/link'
import { Bot, MessageSquare, Sparkles, Plus, Users, TrendingUp, ArrowUpRight, Wallet, Clock } from 'lucide-react'
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
      router.push('/login')
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

  // NOTE: onboarding_status / kyc_status aren't on the DashboardData type yet.
  // Reading them defensively so StatusBanner activates the moment the
  // backend ships these fields, without breaking the build today.
  const onboardingStatus = (dashboardData?.user as any)?.onboarding_status as string | undefined
  const kycStatus = (user as any)?.is_kyc_verified as boolean | undefined

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-brand-ink tracking-tight">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-sm text-brand-ink/55 mt-0.5">Here's an overview of your savings</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-brand-ink/15 text-brand-ink/70 hover:border-primary hover:text-primary gap-1.5"
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

        {/* ── Onboarding / KYC status banner ── */}
        <StatusBanner isKycVerified={kycStatus} />

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Your Savings */}
          <div className="bg-white rounded-2xl border border-brand-ink/10 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-brand-ink/50 uppercase tracking-wide">Your Savings</span>
              <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-brand-gold" />
              </div>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-brand-ink">{formatCurrency(savingsTotal)}</p>
              <p className="text-xs text-brand-ink/40 mt-0.5">Across all groups</p>
            </div>
            <div>
              <div className="flex justify-between text-xs text-brand-ink/55 mb-1.5">
                <span>Progress to goal</span>
                <span className="font-medium text-brand-ink/75">{savingsProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full h-1.5 bg-brand-ink/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${savingsProgress}%` }}
                />
              </div>
              <p className="text-xs text-brand-ink/40 mt-1.5">Goal: {formatCurrency(savingsGoal)}</p>
            </div>
          </div>

          {/* Wallet */}
          <div className="bg-white rounded-2xl border border-brand-ink/10 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-brand-ink/50 uppercase tracking-wide">Wallet Balance</span>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-brand-ink">
                <span className="text-base font-semibold text-brand-ink/40 mr-1">USDC</span>
                {Number(walletBalance || 0).toFixed(2)}
              </p>
              <p className="text-xs text-brand-ink/40 mt-0.5">≈ {formatCurrency((walletBalance || 0) * 1600)}</p>
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
          <div className="bg-white rounded-2xl border border-brand-ink/10 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-brand-ink/50 uppercase tracking-wide">Next Contribution</span>
              <div className="w-8 h-8 rounded-full bg-brand-ink/5 flex items-center justify-center">
                <Clock className="w-4 h-4 text-brand-ink/60" />
              </div>
            </div>
            {hasUpcomingContribution ? (
              <div>
                <p className="text-lg font-bold text-brand-ink">
                  {formatDate(dashboardData?.summary.next_contribution || '')}
                </p>
                <p className="text-xs text-brand-ink/40 mt-0.5">Upcoming due date</p>
              </div>
            ) : (
              <div>
                <p className="text-base font-semibold text-brand-ink/75">Nothing scheduled</p>
                <p className="text-xs text-brand-ink/40 mt-0.5">Join a group to start saving together</p>
              </div>
            )}
          </div>

          {/* Next Payout */}
          <div className="bg-white rounded-2xl border border-brand-ink/10 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-brand-ink/50 uppercase tracking-wide">Next Payout</span>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-primary" />
              </div>
            </div>
            {hasUpcomingPayout ? (
              <div>
                <p className="text-lg font-bold text-brand-ink">{dashboardData?.summary?.next_payout}</p>
                <p className="text-xs text-brand-ink/40 mt-0.5">Expected payout date</p>
              </div>
            ) : (
              <div>
                <p className="text-base font-semibold text-brand-ink/75">No payout yet</p>
                <p className="text-xs text-brand-ink/40 mt-0.5">Your payout date appears after joining a group</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Main Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — Groups + Activity */}
          <div className="lg:col-span-2 space-y-6">

            <div className="bg-white rounded-2xl border border-brand-ink/10 shadow-sm overflow-hidden">
              <GroupsTabView defaultTab="discover" />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-brand-ink/10 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-brand-ink mb-4">Recent Activity</h2>

              {recentActivity.length > 0 ? (
                <div className="divide-y divide-brand-ink/5">
                  {recentActivity.map((activity) => {
                    const isOwnActivity = activity.user_id === user?.id
                    return (
                      <div key={activity.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="w-8 h-8 rounded-full bg-brand-paper flex items-center justify-center shrink-0">
                          <Image
                            src="/assets/icons/fluent_people-community-48-regular (1).svg"
                            alt="Activity"
                            width={16}
                            height={16}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-brand-ink/80">
                            {getActivityDescription(activity, isOwnActivity)}
                          </p>
                          <p className="text-xs text-brand-ink/40 mt-0.5">
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
                  <div className="w-12 h-12 bg-brand-paper rounded-full flex items-center justify-center mb-3">
                    <Image
                      src="/assets/icons/fluent_people-community-48-regular (1).svg"
                      alt="No activity"
                      width={22}
                      height={22}
                    />
                  </div>
                  <p className="text-sm font-medium text-brand-ink/75">No activity yet</p>
                  <p className="text-xs text-brand-ink/40 mt-1 max-w-[220px]">
                    Create or join a group to see your transactions here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right — Savings Goal + AI */}
          <div className="space-y-6">

            {/* Savings Goal */}
            <div className="bg-white rounded-2xl border border-brand-ink/10 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-brand-ink">Savings Goal</h2>
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
                    <p className="text-xs text-brand-ink/40 mb-2 truncate">{savingsGoalName}</p>
                  )}
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-display text-xl font-bold text-brand-ink">{formatCurrency(sst)}</span>
                    <span className="text-xs text-brand-ink/40">of {formatCurrency(ssg)}</span>
                  </div>
                  <div className="w-full h-2 bg-brand-ink/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${savingsGoalProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-2 text-brand-ink/55">
                    <span>{savingsGoalProgress.toFixed(0)}% complete</span>
                    <span>{formatCurrency(savingsGoalRemaining)} left</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 border-brand-ink/15 text-brand-ink/65 hover:border-primary hover:text-primary text-xs"
                    onClick={() => router.push('/dashboard/profile?focus=savings-goal')}
                  >
                    Update Goal
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-brand-ink/55 mb-3">No savings goal set yet.</p>
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
            <div className="bg-white rounded-2xl border border-brand-ink/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-brand-ink">AI Financial Assistant</h2>
              </div>

              <div className="rounded-xl bg-brand-paper border border-brand-gold/15 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs text-brand-ink/65 leading-relaxed">
                    Get personalized financial advice — budgeting tips, savings strategies, and more.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                <p className="text-xs font-medium text-brand-ink/40 mb-2">Try asking:</p>
                {[
                  'How can I save ₦100,000 in 3 months?',
                  "What's the best way to manage my debt?",
                  'How should I budget my monthly income?',
                ].map((q) => (
                  <div
                    key={q}
                    className="bg-brand-paper hover:bg-primary/5 rounded-lg px-3 py-2 text-xs text-brand-ink/65 cursor-pointer transition-colors border border-transparent hover:border-primary/15"
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
              <div className="bg-white rounded-2xl border border-brand-ink/10 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-brand-gold" />
                  <h2 className="text-sm font-semibold text-brand-ink">AI Insights</h2>
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