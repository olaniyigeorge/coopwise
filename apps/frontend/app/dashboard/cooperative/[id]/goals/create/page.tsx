"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, Variants } from 'framer-motion'
import { toast } from 'sonner'
import { 
  Target, 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Layers, 
  UserCheck, 
  FileText, 
  Loader2, 
  CheckCircle2 
} from 'lucide-react'

// Layout & Services
import DashboardLayout from '@/components/dashboard/layout'
import GoalService from '@/services/goal-service'
import CooperativeService from '@/services/cooperative-service'
import { BeneficiaryPattern, Cooperative, GoalCategory } from '@/types/cooperative'


// --- Motion Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
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
      type: 'spring',
      stiffness: 120,
      damping: 18,
    },
  },
}

const buttonHover: Variants = {
  hover: {
    scale: 1.02,
    transition: { type: 'spring', stiffness: 300, damping: 15 },
  },
  tap: { scale: 0.98 },
}

export default function CreateGoalPage() {
  const params = useParams()
  const router = useRouter()
  const cooperativeId = params?.id as string

  // Data States
  const [cooperative, setCooperative] = useState<Cooperative | null>(null)
  const [categories, setCategories] = useState<GoalCategory[]>([])
  const [patterns, setPatterns] = useState<BeneficiaryPattern[]>([])

  // UI Loading States
  const [fetchingData, setFetchingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_amount: '',
    currency: 'NGN',
    target_date: '',
    beneficiary_pattern_id: '',
    goal_category_id: '',
  })

  // Fetch Cooperative Details & Catalog Options
  useEffect(() => {
    async function loadData() {
      if (!cooperativeId) return
      try {
        setFetchingData(true)
        
        // Fetch cooperative details and catalog options concurrently
        const [coopData, categoriesData, patternsData] = await Promise.all([
          CooperativeService.getCooperative(cooperativeId),
          GoalService.getGoalCategories().catch(() => []),
          GoalService.getBeneficiaryPatterns().catch(() => []),
        ])

        setCooperative(coopData)
        setCategories(categoriesData || [])
        setPatterns(patternsData || [])

        // Set default select values if categories or patterns are available
        setFormData((prev) => ({
          ...prev,
          goal_category_id: categoriesData?.[0]?.id || '',
          beneficiary_pattern_id: patternsData?.[0]?.id || '',
        }))
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || err.message || 'Error fetching page data.'
        toast.error(errorMsg)
      } {
        setFetchingData(false)
      }
    }

    loadData()
  }, [cooperativeId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.target_amount || !formData.target_date) {
      toast.error('Please fill in all required fields.')
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        beneficiary_pattern_id: formData.beneficiary_pattern_id || "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        goal_category_id: formData.goal_category_id || "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        name: formData.name,
        description: formData.description,
        target_amount: Number(formData.target_amount),
        currency: formData.currency,
        target_date: formData.target_date,
      }

      await GoalService.createGoal(cooperativeId, payload)

      toast.success('Goal created successfully!')
      router.push(`/dashboard/cooperative/${cooperativeId}`)
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.response?.data?.message || err.message || 'Failed to create goal.'
      toast.error(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-3xl mx-auto space-y-6"
      >
        {/* Back Button */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <button
            onClick={() => router.push(`/dashboard/cooperative/${cooperativeId}`)}
            className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Cooperative
          </button>
        </motion.div>

        {/* Cooperative Info Banner Header */}
        <motion.div 
          variants={itemVariants}
          className="p-5 rounded-2xl bg-white border border-neutral-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Creating Goal For</span>
            {fetchingData ? (
              <div className="h-6 w-40 bg-neutral-200 animate-pulse rounded mt-1" />
            ) : (
              <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                {cooperative?.name}
                {cooperative?.coop_model && (
                  <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    {cooperative.coop_model}
                  </span>
                )}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
            <Target className="w-4 h-4 text-emerald-600" />
            Cooperative Target Goal
          </div>
        </motion.div>

        {/* Main Form Container */}
        <motion.form
          variants={itemVariants}
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 bg-white border border-neutral-100 shadow-sm rounded-2xl space-y-6"
        >
          <div className="border-b border-neutral-100 pb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Goal Configuration</h2>
            <p className="text-sm text-neutral-500">Define target milestone goals, amounts, and deadlines for your group.</p>
          </div>

          <div className="space-y-4">
            {/* Goal Name */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Goal Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Target className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. End of Year Equipment Procurement"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Description</label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief details about what this goal aims to achieve..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all resize-none"
                />
              </div>
            </div>

            {/* Amount & Currency Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Target Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="number"
                    name="target_amount"
                    required
                    min="0"
                    step="any"
                    value={formData.target_amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                >
                  <option value="NGN">NGN (₦)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            {/* Target Date */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Target Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                <input
                  type="date"
                  name="target_date"
                  required
                  value={formData.target_date}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
              </div>
            </div>

            {/* Dynamic Catalog Select Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Goal Category */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">Goal Category</label>
                <div className="relative">
                  <Layers className="w-4 h-4 absolute left-3 top-3 text-neutral-400 pointer-events-none" />
                  {categories.length > 0 ? (
                    <select
                      name="goal_category_id"
                      value={formData.goal_category_id}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="goal_category_id"
                      value={formData.goal_category_id}
                      onChange={handleChange}
                      placeholder="3fa85f64-5717-4562-b3fc-2c963f66afa6"
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono text-xs"
                    />
                  )}
                </div>
              </div>

              {/* Beneficiary Pattern */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">Beneficiary Pattern</label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 absolute left-3 top-3 text-neutral-400 pointer-events-none" />
                  {patterns.length > 0 ? (
                    <select
                      name="beneficiary_pattern_id"
                      value={formData.beneficiary_pattern_id}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    >
                      {patterns.map((pat) => (
                        <option key={pat.id} value={pat.id}>
                          {pat.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="beneficiary_pattern_id"
                      value={formData.beneficiary_pattern_id}
                      onChange={handleChange}
                      placeholder="3fa85f64-5717-4562-b3fc-2c963f66afa6"
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono text-xs"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={submitting}
              className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <motion.button
              type="submit"
              disabled={submitting || fetchingData}
              variants={buttonHover}
              whileHover="hover"
              whileTap="tap"
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Goal...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save Goal
                </>
              )}
            </motion.button>
          </div>
        </motion.form>
      </motion.div>
    </DashboardLayout>
  )
}