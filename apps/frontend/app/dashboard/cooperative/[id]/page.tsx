"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { activityTextAfterActor } from '@/lib/activity'
import { UserAvatar } from '@/components/ui/user-avatar'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import ApplicationsPanel from '@/components/dashboard/applications-panel'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { toast } from 'sonner'
import {
  Users,
  Target,
  Plus,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Calendar,
  ShieldCheck,
  Clock,
  AlertCircle,
  Share,
  Copy,
  Check,
  Loader2,
  Wallet,
  CreditCard,
} from 'lucide-react'
import CooperativeService from '@/services/cooperative-service'
import GoalService from '@/services/goal-service'
import ContributionService, {
  GoalProgress,
  GroupContributionSummary,
} from '@/services/contribution-service'
import { getDashboardData } from '@/services/dashboard-service'
import { getApiErrorDetail } from '@/lib/api-error'
import DashboardLayout from '@/components/dashboard/layout'
import { GoalOwnershipEditor } from '@/components/cooperative/goal-ownership-editor'
import {
  BeneficiaryPattern,
  Cooperative,
  CooperativeMember,
  Goal,
  ActivityDetail,
} from '@/types/cooperative'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// --- Motion Variants ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18,
    },
  },
}

// Keep the activity feed short; the rest is one click away.
const ACTIVITY_VISIBLE_LIMIT = 8

// A cooperative is only "verified" once it has been activated. Until then the
// badge must not claim otherwise — a pending group is exactly that.
const COOP_STATUS_STYLES: Record<string, string> = {
  active:
    'bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]',
  pending:
    'bg-[#FBF1D0] text-[#8A6516] dark:bg-[#3A3120] dark:text-[#E8BC63]',
  paused:
    'bg-[#FBF1D0] text-[#8A6516] dark:bg-[#3A3120] dark:text-[#E8BC63]',
  draft: 'bg-content/5 text-content/55',
  archived: 'bg-content/5 text-content/45',
}

function statusLabel(status?: string | null) {
  if (!status) return 'Unknown'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const buttonHover: Variants = {
  hover: {
    scale: 1.03,
    transition: { type: "spring", stiffness: 300, damping: 15 },
  },
  tap: { scale: 0.97 },
}

export default function CooperativeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params?.id as string

  const [cooperative, setCooperative] = useState<Cooperative | null>(null)
  const [members, setMembers] = useState<CooperativeMember[]>([])
  // Only admitted members belong on the roster; applicants live in ApplicationsPanel.
  const activeMembers = members.filter((m) => (m.status ?? '').toLowerCase() === 'active')
  const { user: currentUser } = useAuth()
  const myMembership = members.find((m) => m.user_id === currentUser?.id)
  const myStatus = (myMembership?.status ?? '').toLowerCase()
  const isPending = myStatus === 'pending'
  const wasRejected = myStatus === 'rejected'
  const [admission, setAdmission] = useState<string | null>(null)

  // A pending applicant is told who is deciding (an admin, or a member vote).
  useEffect(() => {
    if (!isPending) return
    CooperativeService.getCooperativePreview(id)
      .then((p) => setAdmission(p.admission))
      .catch(() => {})
  }, [isPending, id])
  const [goals, setGoals] = useState<Goal[]>([])
  const [patterns, setPatterns] = useState<BeneficiaryPattern[]>([])
  const [ownershipGoal, setOwnershipGoal] = useState<Goal | null>(null)
  const sharedPatternId = patterns.find(
    (pattern) => pattern.code === 'pooled_for_shared'
  )?.id
  const [activities, setActivities] = useState<ActivityDetail[]>([])
  const [showAllActivity, setShowAllActivity] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'members' | 'activity'>('overview')

  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false)
  const [copied, setCopied] = useState(false)

  const [showContributeDialog, setShowContributeDialog] = useState(false)
  const [contributeAmount, setContributeAmount] = useState("")
  const [contributeGoalId, setContributeGoalId] = useState<string>("none")
  const [isContributing, setIsContributing] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [goalProgress, setGoalProgress] = useState<Record<string, GoalProgress>>({})
  const [groupSummary, setGroupSummary] = useState<GroupContributionSummary | null>(null)
  const [activating, setActivating] = useState(false)

  useEffect(() => {
    async function load() {
      if (!id) return
      try {
        setLoading(true)
        setError(null)
        const [coopData, memberData, goalData, activityData, dashboardData, patternData] = await Promise.all([
          CooperativeService.getCooperative(id),
          CooperativeService.getCooperativeMembers(id),
          GoalService.listGoals(id),
          CooperativeService.getCooperativeActivities(id),
          getDashboardData(),
          GoalService.getBeneficiaryPatterns().catch(() => []),
        ])
        setCooperative(coopData)
        setMembers(memberData)
        setGoals(goalData)
        setPatterns(patternData)
        setActivities(activityData)
        setWalletBalance(
          dashboardData?.summary?.wallet?.local_balance != null
            ? Number(dashboardData.summary.wallet.local_balance)
            : null
        )
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || err.message || 'Failed to load cooperative details.'
        setError(errorMsg)
        toast.error(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  useEffect(() => {
    if (goals.length === 0) return
    Promise.all(
      goals.map((goal) =>
        ContributionService.getGoalProgress(goal.id)
          .then((progress) => [goal.id, progress] as const)
          .catch(() => null)
      )
    ).then((results) => {
      const next: Record<string, GoalProgress> = {}
      for (const entry of results) {
        if (entry) next[entry[0]] = entry[1]
      }
      setGoalProgress(next)
    })
  }, [goals])

  // Group-wide contributed total. Applicants can't see it yet (the endpoint
  // requires active membership), so a failure just leaves the fallback in use.
  useEffect(() => {
    if (!id) return
    ContributionService.getGroupContributionSummary(id)
      .then(setGroupSummary)
      .catch(() => setGroupSummary(null))
  }, [id])

  const refreshAfterContribution = async () => {
    const [activityData, memberData, summary] = await Promise.all([
      CooperativeService.getCooperativeActivities(id),
      CooperativeService.getCooperativeMembers(id),
      ContributionService.getGroupContributionSummary(id).catch(() => null),
    ])
    setActivities(activityData)
    setMembers(memberData)
    if (summary) setGroupSummary(summary)

    // Refresh every goal, not just the selected one: a Paystack return
    // remounts this page (selected goal resets) but the goal tiles must still
    // reflect the new contribution.
    const progressResults = await Promise.all(
      goals.map((goal) =>
        ContributionService.getGoalProgress(goal.id)
          .then((progress) => [goal.id, progress] as const)
          .catch(() => null)
      )
    )
    setGoalProgress((prev) => {
      const next = { ...prev }
      for (const entry of progressResults) {
        if (entry) next[entry[0]] = entry[1]
      }
      return next
    })
  }

  // Paystack sends the member back here (via the backend callback) with the
  // payment outcome; report it once, then clear the params so a refresh
  // doesn't repeat the toast.
  useEffect(() => {
    const payment = searchParams.get('payment')
    if (!payment) return
    if (payment === 'success') {
      toast.success('Payment received — your contribution is complete.', { id: 'payment-result' })
      refreshAfterContribution().catch(() => {})
    } else {
      toast.error('Your Paystack payment did not complete. Please try again.', { id: 'payment-result' })
    }
    router.replace(`/dashboard/cooperative/${id}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handlePaystackContribute = async () => {
    const amount = parseFloat(contributeAmount)
    if (!amount || amount < 100) {
      toast.error("Enter an amount of at least ₦100.")
      return
    }
    try {
      setIsContributing(true)
      const res = await ContributionService.initiatePaystack({
        group_id: id,
        amount,
        goal_id: contributeGoalId !== "none" ? contributeGoalId : undefined,
      })
      window.location.href = res.authorization_url
    } catch (err: any) {
      const detail = getApiErrorDetail(err)
      toast.error((typeof detail === "string" ? detail : detail?.message) || err?.message || "Could not start payment.")
      setIsContributing(false)
    }
  }

  const handleContribute = async () => {
    const amount = parseFloat(contributeAmount)
    if (!amount || amount <= 0) {
      toast.error("Enter a valid contribution amount.")
      return
    }
    try {
      setIsContributing(true)
      await ContributionService.contribute({
        group_id: id,
        amount,
        goal_id: contributeGoalId !== "none" ? contributeGoalId : undefined,
      })
      toast.success("Contribution successful!")
      setShowContributeDialog(false)
      await refreshAfterContribution()
      setContributeAmount("")
      setContributeGoalId("none")
    } catch (err: any) {
      const detail = getApiErrorDetail(err)
      const errorMsg = (typeof detail === "string" ? detail : detail?.message) || err?.message || "Failed to process contribution."
      if (errorMsg.toLowerCase().includes("insufficient")) {
        // Close the dialog first — its overlay sits above the toast and
        // would otherwise swallow the click on the action button below.
        setShowContributeDialog(false)
        toast.error(errorMsg, {
          description: "Fund your wallet with Paystack to continue.",
          action: {
            label: "Fund wallet",
            onClick: () => router.push("/dashboard/wallet/fund"),
          },
        })
      } else {
        toast.error(errorMsg)
      }
    } finally {
      setIsContributing(false)
    }
  }

  const generateInvite = async () => {
    try {
      setIsGeneratingInvite(true)
      const data = await CooperativeService.generateInviteCode(id)
      setInviteCode(data.invite_code || "")
      setShowInviteDialog(true)
    } catch {
      toast.error("Failed to generate invite code. Please try again.")
    } finally {
      setIsGeneratingInvite(false)
    }
  }

  const copyInviteLink = async () => {
    try {
      const shareableUrl = `${window.location.origin}/dashboard/join-group?code=${encodeURIComponent(inviteCode)}`
      await navigator.clipboard.writeText(shareableUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy to clipboard.")
    }
  }

  const handleActivate = async () => {
    if (activating) return
    setActivating(true)
    try {
      const updated = await CooperativeService.activateCooperative(id)
      setCooperative(updated)
      toast.success('Cooperative activated', {
        description: 'Members can now contribute and invite others.',
      })
    } catch (err) {
      toast.error(
        getApiErrorDetail(err)?.message ?? 'Could not activate this cooperative.'
      )
    } finally {
      setActivating(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-10 w-40 rounded-full bg-content/5" />
          <div className="h-56 rounded-[24px] bg-surface" />
          <div className="h-14 rounded-full bg-content/5" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-52 rounded-[24px] bg-surface lg:col-span-2" />
            <div className="h-52 rounded-[24px] bg-surface" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !cooperative) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl space-y-4 py-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBE2D6] text-[#B4451F] dark:bg-[#3B2820] dark:text-[#F3B79E]">
            <AlertCircle className="h-7 w-7" />
          </span>
          <h2 className="font-display text-2xl font-bold tracking-tight text-content">
            Cooperative not found
          </h2>
          <p className="text-sm text-content/50">
            {error || "The cooperative you are looking for does not exist or has been removed."}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 rounded-full bg-[#0E3B2E] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0A2E24]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'goals', label: 'Goals' },
    { id: 'members', label: 'Members' },
    { id: 'activity', label: 'Activity' },
  ] as const

  const selectedGoalProgress =
    contributeGoalId !== 'none' ? goalProgress[contributeGoalId] : undefined

  const coopStatus = String(cooperative.status ?? '').toLowerCase()
  const coopStatusStyle =
    COOP_STATUS_STYLES[coopStatus] ?? 'bg-content/5 text-content/55'

  // Only the creator or an admin member can take a pending cooperative live;
  // everyone else waits for one of them.
  const myRole = (myMembership?.role ?? '').toLowerCase()
  const canActivate =
    coopStatus === 'pending' &&
    (myRole === 'admin' || cooperative.created_by === currentUser?.id)

  // What the group has actually pooled. The summary endpoint includes general
  // contributions; the goal-progress sum is the fallback while it loads (or
  // for applicants, who can't call it yet).
  const goalContributedTotal = Object.values(goalProgress).reduce(
    (sum, progress) => sum + (progress.contributed_amount ?? 0),
    0
  )
  const groupContributed = groupSummary?.total_contributed ?? goalContributedTotal
  const goalTargetTotal = goals.reduce(
    (sum, goal) => sum + (goal.target_amount ?? 0),
    0
  )
  // Match the numerator to goals that actually have a target, so a goal with
  // no target can't push the combined percentage above what's funded.
  const goalRaisedTowardTargets = goals.reduce(
    (sum, goal) =>
      sum + (goal.target_amount ? (goalProgress[goal.id]?.contributed_amount ?? 0) : 0),
    0
  )
  const overallGoalPercent =
    goalTargetTotal > 0
      ? Math.min(Math.round((goalRaisedTowardTargets / goalTargetTotal) * 100), 100)
      : null

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-6xl space-y-4 pb-6"
      >
        {/* Back + primary actions */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-content/55 transition-colors hover:text-content"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className={isPending || wasRejected ? 'hidden' : 'flex flex-wrap items-center gap-2.5'}>
            {canActivate && (
              <motion.button
                variants={buttonHover}
                whileHover="hover"
                whileTap="tap"
                onClick={handleActivate}
                disabled={activating}
                className="inline-flex items-center gap-2 rounded-full bg-[#B8892B] px-5 py-2.5 text-sm font-semibold text-[#0B1712] transition-colors hover:bg-[#C99A3A] disabled:opacity-60"
              >
                {activating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                {activating ? 'Activating…' : 'Activate cooperative'}
              </motion.button>
            )}

            <motion.button
              variants={buttonHover}
              whileHover={coopStatus === 'active' ? 'hover' : undefined}
              whileTap={coopStatus === 'active' ? 'tap' : undefined}
              onClick={() => setShowContributeDialog(true)}
              disabled={coopStatus !== 'active'}
              title={
                coopStatus === 'active'
                  ? undefined
                  : 'Contributions open once this cooperative is activated.'
              }
              className="inline-flex items-center gap-2 rounded-full bg-[#0E3B2E] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0A2E24] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Wallet className="w-4 h-4" />
              Contribute
            </motion.button>

            <motion.button
              variants={buttonHover}
              whileHover="hover"
              whileTap="tap"
              onClick={generateInvite}
              disabled={isGeneratingInvite}
              className="inline-flex items-center gap-2 rounded-full border border-content/10 bg-surface px-5 py-2.5 text-sm font-semibold text-content transition-colors hover:bg-content/[0.03] disabled:opacity-60"
            >
              {isGeneratingInvite ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share className="w-4 h-4" />
              )}
              Share invite
            </motion.button>

            <Link href={`/dashboard/cooperative/${id}/goals/create`} passHref>
              <motion.button
                variants={buttonHover}
                whileHover="hover"
                whileTap="tap"
                className="inline-flex items-center gap-2 rounded-full bg-[#1F7A54] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#196546]"
              >
                <Plus className="w-4 h-4" />
                Create Goal
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {(isPending || wasRejected) && (
          <motion.div
            variants={itemVariants}
            className={`rounded-2xl border px-5 py-4 ${
              wasRejected
                ? 'border-[#F3C6C6] bg-[#FDEDED] dark:border-[#5A2A2A] dark:bg-[#2E1717]'
                : 'border-[#EAD9AC] bg-[#FBF3DE] dark:border-[#5A4A22] dark:bg-[#2E2818]'
            }`}
          >
            <p className={`text-sm font-semibold ${wasRejected ? 'text-[#8F2D2D] dark:text-[#F0A9A9]' : 'text-[#7A5A14] dark:text-[#E8BC63]'}`}>
              {wasRejected
                ? "Your request to join wasn't approved"
                : 'Your request to join is waiting for a decision'}
            </p>
            <p className={`mt-0.5 text-sm ${wasRejected ? 'text-[#A24A4A] dark:text-[#E3BDBD]' : 'text-[#8A6A28] dark:text-[#D8C08A]'}`}>
              {wasRejected
                ? 'You can ask a member for a new invite if you think this was a mistake.'
                : admission === 'member_vote'
                  ? "The group's members are voting on your request. You'll be notified, and you can contribute once you're admitted."
                  : "An admin of this group will review your request. You'll be notified, and you can contribute once you're admitted."}
            </p>
          </motion.div>
        )}

        {coopStatus === 'pending' && !isPending && !wasRejected && (
          <motion.div
            variants={itemVariants}
            className="flex items-start gap-3 rounded-2xl border border-[#EAD9AC] bg-[#FBF3DE] px-5 py-4 dark:border-[#5A4A22] dark:bg-[#2E2818]"
          >
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#8A6516] dark:text-[#E8BC63]" />
            <div>
              <p className="text-sm font-semibold text-[#7A5A14] dark:text-[#E8BC63]">
                This cooperative is pending activation
              </p>
              <p className="mt-0.5 text-sm text-[#8A6A28] dark:text-[#D8C08A]">
                {canActivate
                  ? 'Activate it to start collecting contributions and inviting members. Nothing can be paid in until then, which is why the total reads ₦0.'
                  : 'An organizer needs to activate it before contributions can begin.'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Cooperative hero */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-[24px] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)] sm:p-7"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-2xl">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#DFF0E4] text-base font-bold text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]">
                  {cooperative.name?.charAt(0)?.toUpperCase() || 'C'}
                </span>
                <div className="min-w-0">
                  <h1 className="font-display text-2xl font-bold tracking-tight text-content sm:text-3xl">
                    {cooperative.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${coopStatusStyle}`}
                    >
                      {statusLabel(cooperative.status)}
                    </span>
                    <span className="rounded-full bg-content/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-content/60">
                      {cooperative.coop_model}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-content/60">
                {cooperative.description}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-content/50">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-content/35" />
                  Created{' '}
                  {new Date(cooperative.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                {coopStatus === 'active' ? (
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#1F7A54] dark:text-[#7FBF9C]" />
                    Verified cooperative
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[#8A6516] dark:text-[#E8BC63]" />
                    {coopStatus === 'pending'
                      ? 'Pending activation'
                      : `${statusLabel(cooperative.status)} cooperative`}
                  </span>
                )}
                <span className="flex items-center gap-1.5 font-mono text-content/40">
                  ID: {cooperative.id.slice(0, 8)}…
                </span>
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#DFF0E4] p-4 dark:bg-[#1C3A2C]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-[#17603F] dark:bg-white/10 dark:text-[#B7E3C3]">
                  <Users className="h-4 w-4" />
                </span>
                <p className="mt-3 font-display text-2xl font-bold leading-none text-content">
                  {activeMembers.length}
                </p>
                <p className="mt-1 text-[11px] font-medium text-content/55">
                  Member{activeMembers.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="rounded-2xl bg-[#FBF1D0] p-4 dark:bg-[#3A3120]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-[#8A6516] dark:bg-white/10 dark:text-[#E8BC63]">
                  <Target className="h-4 w-4" />
                </span>
                <p className="mt-3 font-display text-2xl font-bold leading-none text-content">
                  {goals.length}
                </p>
                <p className="mt-1 text-[11px] font-medium text-content/55">
                  Goal{goals.length === 1 ? '' : 's'}
                </p>
              </div>

              {/* The number members actually care about: what the group has pooled. */}
              <div className="col-span-2 flex items-center justify-between gap-4 rounded-2xl bg-[#0E3B2E] p-4 text-white dark:bg-[#173B2C]">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                    Total contributed
                  </p>
                  <p className="mt-1.5 font-display text-2xl font-bold leading-none tracking-tight">
                    {formatCurrency(groupContributed)}
                  </p>
                  <p className="mt-1.5 truncate text-[11px] text-white/50">
                    {groupSummary && groupSummary.contribution_count > 0
                      ? `${groupSummary.contributor_count} contributor${
                          groupSummary.contributor_count === 1 ? '' : 's'
                        } · ${groupSummary.contribution_count} contribution${
                          groupSummary.contribution_count === 1 ? '' : 's'
                        }`
                      : goalContributedTotal > 0
                        ? 'Raised across group goals'
                        : coopStatus === 'active'
                          ? 'No contributions yet'
                          : 'Contributions open once this cooperative is active'}
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#E8BC63]">
                  <Wallet className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section tabs */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-full bg-content/[0.04] p-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={isActive}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#0E3B2E] text-white shadow-sm'
                      : 'text-content/55 hover:text-content'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content Display */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 gap-4 lg:grid-cols-3"
              >
                {/* Main section */}
                <div className="space-y-4 lg:col-span-2">
                  <div className="rounded-[24px] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)] sm:p-6">
                    <h3 className="font-display text-base font-bold tracking-tight text-content">
                      About this cooperative
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-content/60">
                      {cooperative.description}
                    </p>
                  </div>

                  <div className="rounded-[24px] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)] sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-display text-base font-bold tracking-tight text-content">
                        Cooperative goals
                      </h3>
                      <Link
                        href={`/dashboard/cooperative/${id}/goals/create`}
                        className="text-xs font-semibold text-[#1F7A54] transition-colors hover:text-[#0E3B2E] dark:text-[#7FBF9C] dark:hover:text-[#B7E3C3]"
                      >
                        + Add new goal
                      </Link>
                    </div>

                    {goals.length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-content/10 p-8 text-center">
                        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FBF1D0] text-[#8A6516] dark:bg-[#3A3120] dark:text-[#E8BC63]">
                          <Target className="h-5 w-5" />
                        </span>
                        <p className="mt-3 text-sm font-semibold text-content">
                          No active goals configured
                        </p>
                        <p className="mt-1 text-xs text-content/50">
                          Set target amounts and deadlines for your cooperative.
                        </p>
                        <Link
                          href={`/dashboard/cooperative/${id}/goals/create`}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#0E3B2E] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0A2E24]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Create target goal
                        </Link>
                      </div>
                    ) : (
                      <>
                        {goalTargetTotal > 0 &&
                          goals.some((goal) => goalProgress[goal.id]) && (
                            <div className="mt-4 rounded-2xl bg-content/[0.03] px-4 py-3">
                              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                <p className="text-sm font-semibold text-content">
                                  {formatCurrency(goalRaisedTowardTargets)}
                                  <span className="font-normal text-content/45">
                                    {' '}raised of {formatCurrency(goalTargetTotal)}
                                  </span>
                                </p>
                                <span className="text-[11px] font-semibold text-[#1F7A54] dark:text-[#7FBF9C]">
                                  {overallGoalPercent}% funded
                                </span>
                              </div>
                              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-content/[0.07]">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#1F7A54] to-[#7FBF9C] transition-all"
                                  style={{ width: `${overallGoalPercent ?? 0}%` }}
                                />
                              </div>
                            </div>
                          )}

                        <div className="mt-2 space-y-2">
                          {goals.slice(0, 3).map((goal) => {
                            const progress = goalProgress[goal.id]
                            const contributed = progress?.contributed_amount ?? 0
                            const percent = progress
                              ? (progress.percent_complete ??
                                (goal.target_amount
                                  ? Math.min((contributed / goal.target_amount) * 100, 100)
                                  : null))
                              : null
                            return (
                              <div
                                key={goal.id}
                                className="rounded-2xl bg-content/[0.03] p-3.5"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-content">
                                      {goal.name}
                                    </p>
                                    <p className="mt-0.5 text-[11px] capitalize text-content/45">
                                      {goal.status}
                                    </p>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <p className="text-sm font-semibold tabular-nums text-content">
                                      {progress ? formatCurrency(contributed) : '—'}
                                    </p>
                                    {goal.target_amount != null && (
                                      <p className="text-[11px] tabular-nums text-content/40">
                                        of {formatCurrency(goal.target_amount)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {goal.target_amount != null && (
                                  <div className="mt-2.5 flex items-center gap-2">
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-content/[0.07]">
                                      <div
                                        className="h-full rounded-full bg-gradient-to-r from-[#1F7A54] to-[#7FBF9C] transition-all"
                                        style={{ width: `${Math.min(percent ?? 0, 100)}%` }}
                                      />
                                    </div>
                                    <span className="w-9 shrink-0 text-right text-[11px] font-semibold tabular-nums text-content/55">
                                      {percent != null ? `${Math.round(percent)}%` : '—'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {goals.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('goals')}
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F7A54] transition-colors hover:text-[#0E3B2E] dark:text-[#7FBF9C] dark:hover:text-[#B7E3C3]"
                          >
                            View all {goals.length} goals
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Side panel */}
                <div className="space-y-4">
                  <div className="rounded-[24px] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)] sm:p-6">
                    <h3 className="font-display text-base font-bold tracking-tight text-content">
                      Model details
                    </h3>
                    <div className="mt-2 text-sm">
                      <div className="flex justify-between gap-3 border-b border-content/[0.06] py-2.5">
                        <span className="text-content/50">Savings model</span>
                        <span className="font-semibold uppercase text-content">
                          {cooperative.coop_model}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-content/[0.06] py-2.5">
                        <span className="text-content/50">Status</span>
                        <span
                          className={`font-semibold uppercase ${
                            coopStatus === 'active'
                              ? 'text-[#1F7A54] dark:text-[#7FBF9C]'
                              : 'text-[#8A6516] dark:text-[#E8BC63]'
                          }`}
                        >
                          {statusLabel(cooperative.status)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3 py-2.5">
                        <span className="text-content/50">Last updated</span>
                        <span className="text-content/75">
                          {new Date(cooperative.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1C3F3B] via-[#173C4A] to-[#123A55] p-5 text-white shadow-[0_18px_40px_-24px_rgba(14,59,46,0.65)]">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#7FBF9C]/10 blur-2xl"
                    />
                    <div className="relative z-10">
                      <Sparkles className="h-4 w-4 text-[#E8BC63]" />
                      <h3 className="mt-2 font-display text-base font-bold tracking-tight">
                        Ask Copilot about this coop
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-white/70">
                        Understand contribution rhythm, liquidity and payout risk
                        before the next round.
                      </p>
                      <Link
                        href={`/dashboard/ai-chat?q=${encodeURIComponent(
                          `Tell me about ${cooperative.name}`
                        )}`}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/15"
                      >
                        Open Copilot
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'goals' && (
              <motion.div
                key="goals"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {goals.length === 0 ? (
                  <div className="rounded-[24px] bg-surface p-8 text-center shadow-[0_1px_2px_rgba(11,23,18,0.04)]">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]">
                      <Target className="h-6 w-6" />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-content">
                      Cooperative savings goals
                    </h3>
                    <p className="mx-auto mt-1 max-w-md text-sm text-content/50">
                      Track targets, monthly payouts, and group milestones in one
                      centralized view.
                    </p>
                    <Link
                      href={`/dashboard/cooperative/${id}/goals/create`}
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0E3B2E] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0A2E24]"
                    >
                      <Plus className="h-4 w-4" />
                      Create first goal
                    </Link>
                  </div>
                ) : (
                  goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="rounded-[24px] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-content">
                            {goal.name}
                          </h4>
                          {goal.description && (
                            <p className="mt-1 text-xs leading-relaxed text-content/50">
                              {goal.description}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 rounded-full bg-[#DFF0E4] px-2.5 py-1 text-[11px] font-semibold capitalize text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]">
                          {goal.status}
                        </span>
                      </div>
                      {goal.target_amount != null && (
                        <p className="mt-3 text-xs text-content/55">
                          Target:{' '}
                          <span className="font-semibold text-content/80">
                            {formatCurrency(goal.target_amount)}
                          </span>
                          {goal.target_date &&
                            ` · Due ${new Date(goal.target_date).toLocaleDateString()}`}
                        </p>
                      )}
                      {goalProgress[goal.id] && (
                        <div className="mt-3 space-y-1.5">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-content/[0.06]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#1F7A54] to-[#7FBF9C] transition-all"
                              style={{ width: `${goalProgress[goal.id].percent_complete ?? 0}%` }}
                            />
                          </div>
                          <p className="text-xs text-content/50">
                            {formatCurrency(goalProgress[goal.id].contributed_amount)} raised
                            {goalProgress[goal.id].percent_complete != null &&
                              ` · ${goalProgress[goal.id].percent_complete}% funded`}
                            {' · '}
                            {goalProgress[goal.id].contributor_count} contributor
                            {goalProgress[goal.id].contributor_count === 1 ? '' : 's'}
                          </p>
                        </div>
                      )}
                      {sharedPatternId &&
                        goal.beneficiary_pattern_id === sharedPatternId && (
                          <button
                            type="button"
                            onClick={() => setOwnershipGoal(goal)}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-content/10 px-3 py-1.5 text-[11px] font-semibold text-content/60 transition-colors hover:border-content/20 hover:bg-content/[0.03] hover:text-content"
                          >
                            <Users className="h-3.5 w-3.5" />
                            Manage ownership
                          </button>
                        )}
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'members' && (
              <motion.div
                key="members"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="rounded-[24px] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)] sm:p-6"
              >
                <ApplicationsPanel groupId={id} onAdmitted={refreshAfterContribution} />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-display text-base font-bold tracking-tight text-content">
                    Member roster
                  </h3>
                  <span className="rounded-full bg-content/5 px-2.5 py-1 text-[11px] font-semibold text-content/55">
                    {activeMembers.length} member{activeMembers.length === 1 ? '' : 's'}
                  </span>
                </div>

                {activeMembers.length === 0 ? (
                  <p className="mt-3 text-sm text-content/50">No members yet.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {activeMembers.map((member) => {
                      const displayName = member.user?.full_name || member.user?.username || 'Unknown member'
                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between gap-3 rounded-2xl bg-content/[0.03] p-3.5"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <UserAvatar name={displayName} src={member.user?.profile_picture_url} size="md" />
                            {member.user?.id ? (
                              <Link
                                href={`/dashboard/users/${member.user.id}`}
                                className="truncate text-sm font-semibold text-content transition-colors hover:text-[#1F7A54] hover:underline dark:hover:text-[#7FBF9C]"
                              >
                                {displayName}
                              </Link>
                            ) : (
                              <p className="truncate text-sm font-semibold text-content">{displayName}</p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {member.role && (
                              <span className="rounded-full bg-[#F1E1B7] px-2.5 py-1 text-[11px] font-semibold capitalize text-[#8A6516] dark:bg-[#3A3120] dark:text-[#E8BC63]">
                                {member.role}
                              </span>
                            )}
                            {member.status && (
                              <span className="rounded-full bg-content/5 px-2.5 py-1 text-[11px] font-semibold capitalize text-content/60">
                                {member.status}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="rounded-[24px] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)] sm:p-6"
              >
                {activities.length === 0 ? (
                  <div className="space-y-3 py-6 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FBE2D6] text-[#B4451F] dark:bg-[#3B2820] dark:text-[#F3B79E]">
                      <Clock className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-semibold text-content">No recent activity recorded</p>
                    <p className="text-xs text-content/50">Contributions and goal creations will show up here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(showAllActivity ? activities : activities.slice(0, ACTIVITY_VISIBLE_LIMIT)).map((activity) => (
                      <div key={activity.id} className="flex items-start justify-between gap-3 border-b border-content/[0.06] pb-3 last:border-b-0 last:pb-0">
                        {activity.actor && (
                          <Link href={`/dashboard/users/${activity.actor.id}`} className="shrink-0" aria-label={`View ${activity.actor.full_name}'s profile`}>
                            <UserAvatar
                              name={activity.actor.full_name}
                              src={activity.actor.profile_picture_url}
                              size="md"
                            />
                          </Link>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-content/75">
                            {activity.actor ? (
                              <>
                                <Link
                                  href={`/dashboard/users/${activity.actor.id}`}
                                  className="font-semibold text-content transition-colors hover:text-[#1F7A54] hover:underline dark:hover:text-[#7FBF9C]"
                                >
                                  {activity.actor.full_name}
                                </Link>{' '}
                                {activityTextAfterActor(activity.description, activity.actor.full_name)}
                              </>
                            ) : (
                              activity.description
                            )}
                          </p>
                          <p className="mt-0.5 text-xs text-content/40">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </div>
                        {activity.amount != null && (
                          <span className="shrink-0 text-xs font-semibold text-content/70">
                            {activity.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    ))}
                    {activities.length > ACTIVITY_VISIBLE_LIMIT && (
                      <button
                        type="button"
                        onClick={() => setShowAllActivity((v) => !v)}
                        className="w-full pt-1 text-xs font-semibold text-[#1F7A54] transition-colors hover:text-[#0E3B2E] dark:text-[#7FBF9C] dark:hover:text-[#B7E3C3]"
                      >
                        {showAllActivity
                          ? 'Show less'
                          : `Show ${activities.length - ACTIVITY_VISIBLE_LIMIT} more`}
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share cooperative invite</DialogTitle>
            <DialogDescription>
              Share this invite code with people you want to join this cooperative.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 min-w-0 gap-2">
              <label className="text-xs font-medium text-content/50">
                Shareable Invite Link
              </label>
              <div className="flex w-full min-w-0 items-center rounded-lg border border-content/10 bg-content/5 p-2">
                <span className="text-sm font-medium flex-1 min-w-0 truncate">
                  {typeof window !== "undefined" ? window.location.origin : ""}/dashboard/join-group?code={inviteCode}
                </span>
              </div>
            </div>
            <Button type="button" size="icon" className="px-3" onClick={copyInviteLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">Copy</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contribute Dialog */}
      <Dialog open={showContributeDialog} onOpenChange={setShowContributeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Make a contribution</DialogTitle>
            <DialogDescription>
              Add to {cooperative?.name ?? "the cooperative"} from your wallet or
              with Paystack.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-1 space-y-5">
            {/* Amount */}
            <div className="space-y-2">
              <Label
                htmlFor="contribute-amount"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-content/45"
              >
                Amount
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-lg font-bold text-content/35">
                  ₦
                </span>
                <Input
                  id="contribute-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  className="h-14 rounded-xl border-content/15 bg-content/[0.03] pl-10 pr-4 font-display text-2xl font-bold tracking-tight md:text-2xl [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Goal */}
            {goals.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-content/45">
                  <span>Goal</span>
                  <span className="font-medium normal-case tracking-normal text-content/35">
                    Optional
                  </span>
                </Label>
                <Select value={contributeGoalId} onValueChange={setContributeGoalId}>
                  <SelectTrigger className="h-11 rounded-xl border-content/15">
                    <SelectValue placeholder="General contribution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General contribution</SelectItem>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedGoalProgress?.target_amount != null && (
                  <p className="text-[11px] text-content/45">
                    {formatCurrency(selectedGoalProgress.contributed_amount)} of{" "}
                    {formatCurrency(selectedGoalProgress.target_amount)} funded
                    {selectedGoalProgress.percent_complete != null &&
                      ` · ${Math.round(selectedGoalProgress.percent_complete)}%`}
                  </p>
                )}
              </div>
            )}

            {/* Wallet balance */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-content/10 bg-content/[0.03] px-3.5 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0E3B2E]/[0.08] text-[#0E3B2E] dark:bg-[#7FBF9C]/10 dark:text-[#7FBF9C]">
                  <Wallet className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] text-content/45">Wallet balance</p>
                  <p className="truncate text-sm font-semibold tabular-nums">
                    {walletBalance != null ? formatCurrency(walletBalance, 2) : "—"}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/wallet/fund"
                className="shrink-0 rounded-full border border-content/15 px-3 py-1.5 text-xs font-semibold text-content/70 transition-colors hover:bg-content/[0.05] hover:text-content"
              >
                Fund
              </Link>
            </div>

            {/* Payment actions */}
            <div className="space-y-2">
              <Button
                type="button"
                className="h-11 w-full rounded-xl"
                disabled={isContributing}
                onClick={handleContribute}
              >
                {isContributing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                Pay from wallet
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-xl border-[#1F7A54]/40 text-[#1F7A54] hover:border-[#1F7A54]/60 hover:bg-[#1F7A54]/5 hover:text-[#0E3B2E] dark:border-[#7FBF9C]/40 dark:text-[#7FBF9C] dark:hover:bg-[#7FBF9C]/10 dark:hover:text-[#B7E3C3]"
                disabled={isContributing}
                onClick={handlePaystackContribute}
              >
                <CreditCard className="h-4 w-4" />
                Pay with Paystack
              </Button>
              <p className="text-center text-[11px] text-content/40">
                Card, bank transfer or USSD
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {ownershipGoal && (
        <GoalOwnershipEditor
          cooperativeId={id}
          goalId={ownershipGoal.id}
          goalName={ownershipGoal.name}
          open={!!ownershipGoal}
          onOpenChange={(open) => {
            if (!open) setOwnershipGoal(null)
          }}
          onSaved={() => toast.success("Ownership shares updated")}
        />
      )}
    </DashboardLayout>
  )
}
