"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { toast } from 'sonner'
import {
  Users,
  Target,
  Plus,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  Clock,
  AlertCircle,
  Share,
  Copy,
  Check,
  Loader2,
  Wallet,
} from 'lucide-react'
import CooperativeService from '@/services/cooperative-service'
import GoalService from '@/services/goal-service'
import ContributionService, { GoalProgress } from '@/services/contribution-service'
import { getDashboardData } from '@/services/dashboard-service'
import { getApiErrorDetail } from '@/lib/api-error'
import DashboardLayout from '@/components/dashboard/layout'
import { Cooperative, CooperativeMember, Goal, ActivityDetail } from '@/types/cooperative'
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
  const id = params?.id as string

  const [cooperative, setCooperative] = useState<Cooperative | null>(null)
  const [members, setMembers] = useState<CooperativeMember[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [activities, setActivities] = useState<ActivityDetail[]>([])
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

  useEffect(() => {
    async function load() {
      if (!id) return
      try {
        setLoading(true)
        setError(null)
        const [coopData, memberData, goalData, activityData, dashboardData] = await Promise.all([
          CooperativeService.getCooperative(id),
          CooperativeService.getCooperativeMembers(id),
          GoalService.listGoals(id),
          CooperativeService.getCooperativeActivities(id),
          getDashboardData(),
        ])
        setCooperative(coopData)
        setMembers(memberData)
        setGoals(goalData)
        setActivities(activityData)
        setWalletBalance(dashboardData?.summary?.wallet?.stable_coin_balance ?? null)
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

  const refreshAfterContribution = async () => {
    const [activityData, memberData] = await Promise.all([
      CooperativeService.getCooperativeActivities(id),
      CooperativeService.getCooperativeMembers(id),
    ])
    setActivities(activityData)
    setMembers(memberData)
    if (contributeGoalId !== "none") {
      const progress = await ContributionService.getGoalProgress(contributeGoalId)
      setGoalProgress((prev) => ({ ...prev, [contributeGoalId]: progress }))
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="h-6 w-32 bg-neutral-200 rounded" />
          <div className="h-44 bg-neutral-200 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-28 bg-neutral-200 rounded-xl" />
            <div className="h-28 bg-neutral-200 rounded-xl" />
            <div className="h-28 bg-neutral-200 rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !cooperative) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-neutral-900">Cooperative Not Found</h2>
          <p className="text-sm text-neutral-500">{error || "The cooperative you are looking for does not exist or has been removed."}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
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

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Navigation Breadcrumb */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </button>

          <div className="flex items-center gap-2">
            <motion.button
              variants={buttonHover}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setShowContributeDialog(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
            >
              <Wallet className="w-4 h-4 mr-1.5" />
              Contribute
            </motion.button>

            <motion.button
              variants={buttonHover}
              whileHover="hover"
              whileTap="tap"
              onClick={generateInvite}
              disabled={isGeneratingInvite}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 hover:border-emerald-300 hover:text-emerald-700 rounded-xl shadow-sm transition-colors"
            >
              {isGeneratingInvite ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Share className="w-4 h-4 mr-1.5" />
              )}
              Share invite
            </motion.button>

            <Link href={`/dashboard/cooperative/${id}/goals/create`} passHref>
              <motion.button
                variants={buttonHover}
                whileHover="hover"
                whileTap="tap"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create Goal
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Cooperative Header Card */}
        <motion.div
          variants={itemVariants}
          className="p-6 sm:p-8 bg-white border border-neutral-100 shadow-sm rounded-2xl relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{cooperative.name}</h1>
                <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
                  {cooperative.status}
                </span>
                <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-neutral-700 bg-neutral-100 border border-neutral-200 rounded-full">
                  {cooperative.coop_model}
                </span>
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed">{cooperative.description}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-neutral-100 flex flex-wrap items-center gap-6 text-xs text-neutral-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-neutral-400" />
              Created {new Date(cooperative.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified Cooperative
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              ID: {cooperative.id.slice(0, 8)}...
            </div>
          </div>
        </motion.div>

        {/* Dynamic Metric Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 bg-white border border-neutral-100 shadow-sm rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Total Members</p>
              <h3 className="text-xl font-bold text-neutral-900 mt-0.5">
                {members.length} Member{members.length === 1 ? '' : 's'}
              </h3>
            </div>
          </div>

          <div className="p-5 bg-white border border-neutral-100 shadow-sm rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Goals</p>
              <h3 className="text-xl font-bold text-neutral-900 mt-0.5">
                {goals.length} {goals.length === 1 ? 'Goal' : 'Goals'}
              </h3>
            </div>
          </div>
        </motion.div>

        {/* Animated Shared Layout Tabs */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex border-b border-neutral-200">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                    isActive ? 'text-emerald-700' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
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
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Main Section */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-6 bg-white border border-neutral-100 shadow-sm rounded-2xl space-y-4">
                    <h3 className="text-base font-semibold text-neutral-900">About this Cooperative</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">{cooperative.description}</p>
                  </div>

                  <div className="p-6 bg-white border border-neutral-100 shadow-sm rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-neutral-900">Cooperative Goals</h3>
                      <Link
                        href={`/dashboard/cooperative/${id}/goals/create`}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        + Add New Goal
                      </Link>
                    </div>

                    {goals.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-neutral-200 rounded-xl space-y-3">
                        <Target className="w-10 h-10 text-neutral-300 mx-auto" />
                        <div>
                          <p className="text-sm font-medium text-neutral-800">No active goals configured</p>
                          <p className="text-xs text-neutral-500 mt-0.5">Set target amounts and deadlines for your cooperative.</p>
                        </div>
                        <Link href={`/dashboard/cooperative/${id}/goals/create`}>
                          <button className="mt-2 px-4 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors">
                            Create Target Goal
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {goals.slice(0, 3).map((goal) => (
                          <div key={goal.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                            <div>
                              <p className="text-sm font-medium text-neutral-900">{goal.name}</p>
                              <p className="text-xs text-neutral-500 capitalize">{goal.status}</p>
                            </div>
                            {goal.target_amount != null && (
                              <span className="text-xs font-semibold text-neutral-700">
                                {goal.currency} {goal.target_amount.toLocaleString()}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar Info Panel */}
                <div className="space-y-6">
                  <div className="p-6 bg-white border border-neutral-100 shadow-sm rounded-2xl space-y-4">
                    <h3 className="text-base font-semibold text-neutral-900">Model Details</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-neutral-100">
                        <span className="text-neutral-500">Savings Model</span>
                        <span className="font-semibold text-neutral-900 uppercase">{cooperative.coop_model}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-neutral-100">
                        <span className="text-neutral-500">Status</span>
                        <span className="font-semibold text-emerald-600 uppercase">{cooperative.status}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-neutral-500">Last Updated</span>
                        <span className="text-neutral-800">{new Date(cooperative.updated_at).toLocaleDateString()}</span>
                      </div>
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
                className="space-y-4"
              >
                {goals.length === 0 ? (
                  <div className="p-8 bg-white border border-neutral-100 shadow-sm rounded-2xl text-center space-y-4">
                    <Target className="w-12 h-12 text-emerald-600 mx-auto" />
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900">Cooperative Savings Goals</h3>
                      <p className="text-sm text-neutral-500 max-w-md mx-auto mt-1">
                        Track targets, monthly payouts, and group milestones in one centralized view.
                      </p>
                    </div>
                    <Link href={`/dashboard/cooperative/${id}/goals/create`}>
                      <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors">
                        <Plus className="w-4 h-4 mr-1.5" />
                        Create First Goal
                      </button>
                    </Link>
                  </div>
                ) : (
                  goals.map((goal) => (
                    <div key={goal.id} className="p-5 bg-white border border-neutral-100 shadow-sm rounded-2xl">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-neutral-900">{goal.name}</h4>
                          {goal.description && (
                            <p className="text-xs text-neutral-500 mt-1">{goal.description}</p>
                          )}
                        </div>
                        <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200 capitalize">
                          {goal.status}
                        </span>
                      </div>
                      {goal.target_amount != null && (
                        <p className="text-xs text-neutral-600 mt-3">
                          Target: <span className="font-semibold">{goal.currency} {goal.target_amount.toLocaleString()}</span>
                          {goal.target_date && ` · Due ${new Date(goal.target_date).toLocaleDateString()}`}
                        </p>
                      )}
                      {goalProgress[goal.id] && (
                        <div className="mt-3 space-y-1.5">
                          <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${goalProgress[goal.id].percent_complete ?? 0}%` }}
                            />
                          </div>
                          <p className="text-xs text-neutral-500">
                            {goalProgress[goal.id].currency} {goalProgress[goal.id].contributed_amount.toLocaleString()} raised
                            {goalProgress[goal.id].percent_complete != null && ` · ${goalProgress[goal.id].percent_complete}% funded`}
                            {' · '}{goalProgress[goal.id].contributor_count} contributor{goalProgress[goal.id].contributor_count === 1 ? '' : 's'}
                          </p>
                        </div>
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
                className="p-6 bg-white border border-neutral-100 shadow-sm rounded-2xl space-y-4"
              >
                <h3 className="text-base font-semibold text-neutral-900">Member Roster</h3>
                {members.length === 0 ? (
                  <p className="text-sm text-neutral-500">No members yet.</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => {
                      const displayName = member.user?.full_name || member.user?.username || 'Unknown member'
                      const initial = displayName.charAt(0).toUpperCase() || '?'
                      return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 overflow-hidden relative">
                            {member.user?.profile_picture_url ? (
                              <Image
                                src={member.user.profile_picture_url}
                                alt={displayName}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              initial
                            )}
                          </div>
                          <p className="text-sm font-medium text-neutral-900 truncate">{displayName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.role && (
                            <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200 capitalize">
                              {member.role}
                            </span>
                          )}
                          {member.status && (
                            <span className="px-2.5 py-1 text-xs font-semibold text-neutral-600 bg-neutral-100 rounded-full border border-neutral-200 capitalize">
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
                className="p-6 bg-white border border-neutral-100 shadow-sm rounded-2xl"
              >
                {activities.length === 0 ? (
                  <div className="text-center space-y-3 py-6">
                    <Clock className="w-10 h-10 text-neutral-300 mx-auto" />
                    <p className="text-sm font-medium text-neutral-700">No recent activity recorded</p>
                    <p className="text-xs text-neutral-500">Contributions and goal creations will show up here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start justify-between border-b border-neutral-100 pb-3 last:border-b-0 last:pb-0">
                        <div>
                          <p className="text-sm text-neutral-800">{activity.description}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </div>
                        {activity.amount != null && (
                          <span className="text-xs font-semibold text-neutral-700">
                            {activity.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    ))}
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
              <label className="text-xs font-medium text-gray-500">
                Shareable Invite Link
              </label>
              <div className="flex w-full min-w-0 items-center border rounded-md p-2 bg-gray-50">
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
            <DialogTitle>Make a contribution</DialogTitle>
            <DialogDescription>
              Funds are debited from your CoopWise wallet balance
              {walletBalance != null && (
                <span className="flex items-center justify-between mt-1 text-xs text-neutral-500">
                  <span>Available balance: <span className="font-semibold text-neutral-700">{walletBalance.toLocaleString()}</span></span>
                  <Link href="/dashboard/wallet/fund" className="font-semibold text-emerald-700 hover:text-emerald-800">
                    Fund wallet
                  </Link>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="contribute-amount">Amount</Label>
              <Input
                id="contribute-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 5000"
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
              />
            </div>

            {goals.length > 0 && (
              <div className="space-y-1.5">
                <Label>Apply toward a goal (optional)</Label>
                <Select value={contributeGoalId} onValueChange={setContributeGoalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No specific goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific goal</SelectItem>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              type="button"
              className="w-full"
              disabled={isContributing}
              onClick={handleContribute}
            >
              {isContributing ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Wallet className="w-4 h-4 mr-1.5" />
              )}
              Confirm contribution
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
