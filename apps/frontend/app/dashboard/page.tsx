'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  ChevronDown,
  LogOut,
  Plus,
  User,
  UserPlus,
} from 'lucide-react'

import { useAuthStore } from '@/lib/hooks/use-app-store'
import useNotificationStore from '@/stores/notification-store'
import { useDashboardChromeStore } from '@/stores/dashboard-chrome-store'
import DashboardLayout from '@/components/dashboard/layout'
import ThemeToggle from '@/components/theme-toggle'
import { UserAvatar } from '@/components/ui/user-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getDashboardData,
  DashboardData,
  defDashData,
  MembershipStatus,
  type WalletDetail,
} from '@/services/dashboard-service'
import WalletService from '@/services/wallet-service'
import { getKYCOverview } from '@/services/kyc-service'
import RulesService from '@/services/rules-service'
import {
  computeTrustStanding,
  deriveTrustInputsFromDashboard,
  describeTrustScore,
} from '@/services/trust-service'
import type { FinancialRule, Cooperative } from '@/types/cooperative'
import CooperativeService from '@/services/cooperative-service'

import WalletHero from '@/components/dashboard/home/wallet-hero'
import QuickActions from '@/components/dashboard/home/quick-actions'
import CooperativesTable, {
  type CooperativeRow,
} from '@/components/dashboard/home/cooperatives-table'
import ActionQueue from '@/components/dashboard/home/needs-you'
import CopilotPanel from '@/components/dashboard/home/coop-copilot'

function monthsSince(iso?: string | null) {
  if (!iso) return 1
  const joined = new Date(iso)
  if (Number.isNaN(joined.getTime())) return 1
  const now = new Date()
  return Math.max(
    1,
    (now.getFullYear() - joined.getFullYear()) * 12 +
      (now.getMonth() - joined.getMonth())
  )
}

export default function Dashboard() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const setTrust = useDashboardChromeStore((state) => state.setTrust)
  // Last confirmed score from a previous visit — shown until this page's own
  // payload arrives so the badge never flips through a placeholder value.
  const storedTrustScore = useDashboardChromeStore((state) => state.trustScore)
  const storedTenureMonths = useDashboardChromeStore(
    (state) => state.tenureMonths
  )

  const [loading, setLoading] = useState(true)
  const [dashboardReady, setDashboardReady] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData>(defDashData)
  const [kycVerified, setKycVerified] = useState<boolean | undefined>(undefined)
  const [rulesByCoop, setRulesByCoop] = useState<
    Record<string, FinancialRule | null>
  >({})
  // The dashboard payload's groups section is optional and is swallowed
  // server-side if one of its queries fails, so the landing page also asks
  // /cooperatives/me directly. Between the two, a member always sees the
  // cooperatives they created or joined.
  const [myCooperatives, setMyCooperatives] = useState<Cooperative[]>([])
  const [coopsLoading, setCoopsLoading] = useState(true)
  const [wallet, setWallet] = useState<WalletDetail | null>(null)
  // The balance skeleton ends when the wallet call finishes, fails, or times
  // out. A new member with no row yet should see ₦0, not a pulse that never ends.
  const [walletSettled, setWalletSettled] = useState(false)
  const [rulesLoading, setRulesLoading] = useState(false)

  const userGroups = useMemo(() => {
    const merged = new Map<string, CooperativeRow>()
    for (const group of dashboardData.groups?.user_groups ?? []) {
      merged.set(group.id, group)
    }
    for (const group of myCooperatives) {
      merged.set(group.id, group)
    }
    return Array.from(merged.values())
  }, [dashboardData.groups, myCooperatives])

  const firstName = user?.full_name?.split(' ')[0] || 'Member'

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 8000)

    const dashboardPromise = getDashboardData()
      .then((data) => {
        if (cancelled) return
        setDashboardData(data)
        setDashboardReady(true)
      })
      .catch((error) => {
        console.error('Error fetching dashboard data:', error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
        window.clearTimeout(timer)
      })

    const kycPromise = getKYCOverview()
      .then((kyc) => {
        if (!cancelled) setKycVerified(kyc.overall_status === 'verified')
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setKycVerified(false)
      })

    void Promise.all([dashboardPromise, kycPromise])
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      setWalletSettled(true)
      return
    }
    let cancelled = false
    setWalletSettled(false)
    const timer = window.setTimeout(() => {
      if (!cancelled) setWalletSettled(true)
    }, 8000)
    WalletService.getWallet()
      .then((detail) => {
        if (!cancelled && detail) setWallet(detail)
      })
      .catch((error) => {
        console.error('Error loading wallet:', error)
      })
      .finally(() => {
        if (!cancelled) setWalletSettled(true)
        window.clearTimeout(timer)
      })
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      setCoopsLoading(false)
      return
    }
    let cancelled = false
    setCoopsLoading(true)
    const timer = window.setTimeout(() => {
      if (!cancelled) setCoopsLoading(false)
    }, 8000)
    CooperativeService.listMyCooperatives()
      .then((groups) => {
        if (!cancelled) setMyCooperatives(Array.isArray(groups) ? groups : [])
      })
      .catch((error) => {
        console.error('Error loading your cooperatives:', error)
        if (!cancelled) setMyCooperatives([])
      })
      .finally(() => {
        if (!cancelled) setCoopsLoading(false)
        window.clearTimeout(timer)
      })
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [isAuthenticated])

  // The dashboard payload carries the cooperatives but not their financial
  // rule, so the landing table fetches each active rule once. A cooperative
  // without a rule yet simply renders an em dash.
  useEffect(() => {
    if (userGroups.length === 0) {
      setRulesByCoop({})
      setRulesLoading(false)
      return
    }

    let cancelled = false
    setRulesLoading(true)
    Promise.all(
      userGroups.map(async (group) => {
        const rule = await RulesService.getActiveFinancialRule(group.id).catch(
          () => null
        )
        return [group.id, rule] as const
      })
    )
      .then((entries) => {
        if (!cancelled) {
          setRulesByCoop(Object.fromEntries(entries))
        }
      })
      .finally(() => {
        if (!cancelled) setRulesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userGroups])

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/signin')
    }
  }, [isAuthenticated, router, loading])

  // The dashboard payload can omit the groups section; the separate
  // /cooperatives/me fetch fills the gap. Trust counts the fuller of the two.
  const trustInputs = {
    ...deriveTrustInputsFromDashboard(dashboardData),
    activeCoopCount: Math.max(
      dashboardData.groups?.user_groups?.length ?? 0,
      myCooperatives.length
    ),
  }
  const trustStanding = computeTrustStanding(trustInputs)

  const memberSince =
    dashboardData.user?.created_at ||
    (typeof user?.created_at === 'string' ? user.created_at : undefined)
  const tenureMonths = monthsSince(memberSince)

  // Wait for every input the score depends on before committing it, so it
  // settles once instead of ticking up as each request lands.
  const trustReady = dashboardReady && !coopsLoading

  useEffect(() => {
    // Only commit a score once the real payload is in; writing the placeholder
    // computed from defDashData is what made the badge jump during loading.
    if (!trustReady) return
    setTrust(trustStanding.score, tenureMonths)
  }, [trustReady, trustStanding.score, tenureMonths, setTrust])

  // Until this page has its own data, keep showing the last confirmed score
  // rather than a value derived from the empty placeholder payload.
  const displayTrustScore = trustReady ? trustStanding.score : storedTrustScore
  const displayTenureMonths = trustReady ? tenureMonths : storedTenureMonths
  const displayTierLabel = trustReady
    ? trustStanding.tierLabel
    : describeTrustScore(storedTrustScore).tierLabel

  if (!isAuthenticated && !loading) return null

  // The dedicated wallet read lands first. The dashboard summary is only a
  // fallback so a failed wallet call can still fill the hero. A missing
  // wallet (brand-new account) is ₦0, not an endless skeleton.
  const resolvedWallet =
    wallet ?? (dashboardReady ? dashboardData.summary?.wallet ?? null : null)
  const balanceLoading = resolvedWallet == null && !walletSettled
  const walletBalance = Number(resolvedWallet?.stable_coin_balance ?? 0)
  const walletLocalBalance = Number(resolvedWallet?.local_balance ?? 0)
  const walletCurrency = resolvedWallet?.local_currency || 'NGN'
  const activeGoalsCount = dashboardData.targets?.group_goals?.length || 0
  const pendingInvitations =
    dashboardData.cooperative_members?.filter(
      (member) => member.status === MembershipStatus.PENDING
    ).length || 0
  const pendingContributions = dashboardData.summary?.next_contribution ? 1 : 0

  async function handleLogout() {
    await logout()
    router.replace('/signin')
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 pb-6">
        {/* ── Welcome header ── */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold tracking-tight text-content sm:text-4xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1.5 text-sm text-content/50">
              {displayTierLabel} · {displayTenureMonths}{' '}
              {displayTenureMonths === 1 ? 'month' : 'months'} in the network
            </p>
          </div>

          <div className="hidden items-center gap-2.5 lg:flex">
            <Link
              href="/dashboard/join-group"
              className="inline-flex items-center gap-2 rounded-full border border-content/10 bg-surface px-5 py-2.5 text-sm font-semibold text-content transition-colors hover:bg-content/[0.03]"
            >
              <UserPlus className="h-4 w-4" />
              Join Cooperative
            </Link>
            <Link
              href="/dashboard/create-cooperative"
              className="inline-flex items-center gap-2 rounded-full bg-[#0E3B2E] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0A2E24]"
            >
              <Plus className="h-4 w-4" />
              Create Coop
            </Link>

            <ThemeToggle />

            <Link
              href="/dashboard/notifications"
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface text-content/70 transition-colors hover:text-content"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#E8762B] ring-2 ring-surface" />
              )}
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E3B2E]/30"
                  aria-label="Account menu"
                >
                  <UserAvatar
                    name={user?.full_name}
                    src={user?.profile_picture_url}
                    size="md"
                    className="h-10 w-10"
                  />
                  <ChevronDown className="h-3.5 w-3.5 text-content/45" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/account" className="cursor-pointer py-2.5">
                    <User className="mr-2 h-4 w-4" />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer py-2.5 text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <WalletHero
          localBalance={walletLocalBalance}
          stableBalance={walletBalance}
          localCurrency={walletCurrency}
          trustScore={displayTrustScore}
          kycVerified={kycVerified}
          activeGoalsCount={activeGoalsCount}
          seatsTaken={userGroups.length}
          balanceLoading={balanceLoading}
          statsLoading={!trustReady}
        />

        <QuickActions />

        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1.65fr_1fr]">
          <CooperativesTable
            groups={userGroups}
            rulesByCoop={rulesByCoop}
            loading={
              coopsLoading &&
              userGroups.length === 0 &&
              !(
                dashboardReady &&
                (dashboardData.groups?.user_groups?.length ?? 0) === 0
              )
            }
            rulesLoading={rulesLoading}
          />

          <div className="flex flex-col gap-4">
            <ActionQueue
              isKycVerified={kycVerified}
              pendingContributionsCount={pendingContributions}
              invitationsCount={pendingInvitations}
            />
            <CopilotPanel />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
