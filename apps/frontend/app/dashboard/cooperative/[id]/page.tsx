"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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
  Activity, 
  AlertCircle,
  TrendingUp,
  CreditCard,
  Settings,
  MoreVertical
} from 'lucide-react'
import CooperativeService from '@/services/cooperative-service'
import DashboardLayout from '@/components/dashboard/layout'
import { Cooperative } from '@/types/cooperative'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'members' | 'activity'>('overview')

  useEffect(() => {
    async function loadCooperative() {
      if (!id) return
      try {
        setLoading(true)
        setError(null)
        const data = await CooperativeService.getCooperative(id)
        setCooperative(data)
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || err.message || 'Failed to load cooperative details.'
        setError(errorMsg)
        toast.error(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    loadCooperative()
  }, [id])

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
          <p className="text-sm text-neutral-500">{error || "The cooperative group you are looking for does not exist or has been removed."}</p>
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

          <Link
            href={`/dashboard/cooperative/${id}/goals/create`}
            passHref
          >
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

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <button 
                aria-label="Cooperative settings"
                className="p-2.5 text-neutral-400 hover:text-neutral-600 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition-all"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button 
                aria-label="More options"
                className="p-2.5 text-neutral-400 hover:text-neutral-600 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition-all"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
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
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white border border-neutral-100 shadow-sm rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Total Savings</p>
              <h3 className="text-xl font-bold text-neutral-900 mt-0.5">₦0.00</h3>
            </div>
          </div>

          <div className="p-5 bg-white border border-neutral-100 shadow-sm rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Total Members</p>
              <h3 className="text-xl font-bold text-neutral-900 mt-0.5">1 Member</h3>
            </div>
          </div>

          <div className="p-5 bg-white border border-neutral-100 shadow-sm rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Active Goals</p>
              <h3 className="text-xl font-bold text-neutral-900 mt-0.5">0 Active</h3>
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
                className="p-8 bg-white border border-neutral-100 shadow-sm rounded-2xl text-center space-y-4"
              >
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
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                      C
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Creator / Admin</p>
                      <p className="text-xs text-neutral-500 font-mono">{cooperative.created_by}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                    Admin
                  </span>
                </div>
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-8 bg-white border border-neutral-100 shadow-sm rounded-2xl text-center space-y-3"
              >
                <Clock className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="text-sm font-medium text-neutral-700">No recent activity recorded</p>
                <p className="text-xs text-neutral-500">Contributions and goal creations will show up here.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}