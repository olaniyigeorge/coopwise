'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/hooks/use-app-store'
import DashboardLayout from '@/components/dashboard/layout'
import StatusBanner from '@/components/dashboard/status-banner'
import { Button } from '@/components/ui/button'
import { getDashboardData, DashboardData, defDashData, MembershipStatus } from '@/services/dashboard-service'
import { getKYCOverview } from '@/services/kyc-service'
import { computeTrustStanding, deriveTrustInputsFromDashboard } from '@/services/trust-service'
import { Plus, Users } from 'lucide-react'

// Custom Portfolio + Trust Hub Components
import TrustStandingCard from '@/components/dashboard/home/trust-standing-card'
import PortfolioStrip from '@/components/dashboard/home/portfolio-strip'
import CooperativeCard from '@/components/dashboard/home/cooperative-card'
import NeedsYou from '@/components/dashboard/home/needs-you'
import SharedActivity from '@/components/dashboard/home/shared-activity'
import CoopCopilot from '@/components/dashboard/home/coop-copilot'

export default function Dashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData>(defDashData)
  const [kycVerified, setKycVerified] = useState<boolean | undefined>(undefined)

  const firstName = user?.full_name?.split(' ')[0] || 'Member'

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

        try {
          const kyc = await getKYCOverview()
          setKycVerified(kyc.overall_status === 'verified')
        } catch (err) {
          console.error(err)
          setKycVerified(false)
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

  // Derived Trust Standing (Pure Computation)
  const trustInputs = deriveTrustInputsFromDashboard(dashboardData)
  const trustStanding = computeTrustStanding(trustInputs)

  // Derived Portfolio Values
  const userGroups = dashboardData.groups?.user_groups || []
  const walletBalance = dashboardData.summary?.wallet?.stable_coin_balance ?? 0
  const activeGoalsCount = dashboardData.targets?.group_goals?.length || 0
  const pendingInvitations = dashboardData.cooperative_members?.filter(
    (m) => m.status === MembershipStatus.PENDING
  ).length || 0
  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-brand-ink tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-brand-ink/55 mt-0.5">
              Cross-cooperative portfolio & action hub
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-brand-ink/15 text-brand-ink/70 hover:border-primary hover:text-brand-gold gap-1.5"
              onClick={() => router.push('/dashboard/join-group')}
            >
              <Users className="w-3.5 h-3.5" />
              Join Cooperative
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => router.push('/dashboard/create-cooperative')}
            >
              <Plus className="w-3.5 h-3.5" />
              Create Coop
            </Button>
          </div>
        </div>

        {/* ── Onboarding / KYC Banner ── */}
        <StatusBanner isKycVerified={kycVerified} />

        {/* ── Derived Trust Standing Hero ── */}
        <TrustStandingCard standing={trustStanding} />

        {/* ── Portfolio Overview Strip ── */}
        <PortfolioStrip
          coopCount={userGroups.length}
          totalCoordinated={dashboardData.summary?.your_savings || 0}
          activeGoalsCount={activeGoalsCount}
          walletBalance={walletBalance}
        />

        {/* ── Main Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (Cooperatives + Activity) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Cooperatives Cards Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-brand-ink uppercase tracking-wider">
                  Your Cooperatives ({userGroups.length})
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary"
                  onClick={() => router.push('/dashboard/my-group')}
                >
                  View All
                </Button>
              </div>

              {userGroups.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userGroups.map((coop) => (
                    <CooperativeCard key={coop.id} cooperative={coop} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-brand-ink/10 p-8 text-center space-y-3">
                  <p className="text-sm font-medium text-brand-ink/70">No active cooperatives yet</p>
                  <p className="text-xs text-brand-ink/40 max-w-sm mx-auto">
                    Join or create a group to start building collective savings and trust standing.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => router.push('/dashboard/join-group')}
                  >
                    Explore Groups
                  </Button>
                </div>
              )}
            </div>

            {/* Cross-Cooperative Shared Ledger */}
            <SharedActivity
              activities={dashboardData.activities || []}
              currentUserId={user?.id}
            />
          </div>

          {/* Right Column (Action Queue + Copilot) */}
          <div className="space-y-6">
            {/* Needs You Action Queue */}
            <NeedsYou
              isKycVerified={kycVerified}
              pendingContributionsCount={dashboardData.summary?.next_contribution ? 1 : 0}
              invitationsCount={pendingInvitations}
            />

            {/* Reframed AI Copilot */}
            <CoopCopilot insights={dashboardData.ai_insights} />
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="flex md:hidden gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 border-primary text-primary hover:bg-primary hover:text-white"
            onClick={() => router.push('/dashboard/join-group')}
          >
            Join Group
          </Button>
          <Button
            className="flex-1"
            onClick={() => router.push('/dashboard/create-cooperative')}
          >
            Create Cooperative
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}