"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import useAuthStore from '@/lib/stores/auth-store'

interface ProfileData {
  fullName: string
  phoneNumber: string
  email: string
  monthlySavingsTarget: string
  savingAmountGoal: string
  savingGoal: string
  savingFrequency: string
}

function CopyIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function WalletIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}

function WalletAddressCard({ address, provider }: { address: string; provider: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const short = `${address.slice(0, 6)}...${address.slice(-6)}`

  return (
    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
      <div className="flex-shrink-0 w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
        <WalletIcon className="w-4 h-4 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium capitalize">{provider} Wallet</p>
        <p className="text-sm font-mono text-gray-800 truncate">{short}</p>
      </div>
      <button
        onClick={handleCopy}
        title="Copy full address"
        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
      >
        {copied ? <CheckIcon className="w-4 h-4 text-green-600" /> : <CopyIcon className="w-4 h-4" />}
      </button>
    </div>
  )
}

function BadgePill({ verified }: { verified: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
      verified
        ? 'bg-green-50 text-green-700 border border-green-200'
        : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${verified ? 'bg-green-500' : 'bg-yellow-400'}`} />
      {verified ? 'Verified' : 'Unverified'}
    </span>
  )
}

export default function ProfileContent() {
  const { updateUserProfile, refreshUserData } = useAuth()
  const { user } = useAuthStore()
  const searchParams = useSearchParams()
  const focusSection = searchParams.get('focus')
  const savingsGoalRef = useRef<HTMLDivElement>(null)

  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    phoneNumber: '',
    email: '',
    monthlySavingsTarget: '',
    savingAmountGoal: '',
    savingGoal: '',
    savingFrequency: '',
  })

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.full_name || '',
        phoneNumber: user.phone_number || '',
        email: user.email || '',
        monthlySavingsTarget: user.income_range || '',
        savingAmountGoal: user.target_savings_amount?.toString() || '',
        savingGoal: user.savings_purpose || '',
        savingFrequency: user.saving_frequency || '',
      })
    } else {
      refreshUserData()
    }
  }, [user, refreshUserData])

  useEffect(() => {
    if (focusSection === 'savings-goal' && savingsGoalRef.current) {
      const timer = setTimeout(() => {
        savingsGoalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        savingsGoalRef.current?.classList.add('ring-2', 'ring-indigo-400', 'ring-opacity-60')
        setTimeout(() => {
          savingsGoalRef.current?.classList.remove('ring-2', 'ring-indigo-400', 'ring-opacity-60')
        }, 2000)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [focusSection])

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveChanges = async () => {
    if (!user) {
      toast.error('You must be logged in to update your profile')
      return
    }

    setIsLoading(true)

    try {
      const updateData = {
        id: user.id,
        resource_owner_id: user.id,
        username: user.username,
        email: profileData.email,
        full_name: profileData.fullName,
        phone_number: profileData.phoneNumber,
        role: user.role || 'user',
        target_savings_amount: profileData.savingAmountGoal ? parseFloat(profileData.savingAmountGoal) : 0,
        savings_purpose: profileData.savingGoal || '',
        income_range: profileData.monthlySavingsTarget || 'Below 50K',
        saving_frequency: profileData.savingFrequency || 'daily',
        is_email_verified: user.is_email_verified ?? false,
        is_phone_verified: user.is_phone_verified ?? false,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await updateUserProfile(updateData)
      toast.success('Profile updated successfully!', { description: 'Your changes have been saved.' })
    } catch (error: any) {
      let errorMessage = 'Failed to update your profile'
      if (error.response?.data?.detail) {
        errorMessage = Array.isArray(error.response.data.detail)
          ? error.response.data.detail.map((e: any) => `${e.loc.join('.')}: ${e.msg}`).join(', ')
          : error.response.data.detail
      } else if (error.message) {
        errorMessage = error.message
      }
      toast.error('Update failed', { description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 px-4 py-6">

      {/* Focus Banner */}
      {focusSection === 'savings-goal' && (
        <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-800">Update Your Savings Goal</p>
            <p className="text-xs text-indigo-600 mt-0.5">Scroll down to update your savings target, goal purpose, and frequency.</p>
          </div>
        </div>
      )}

      {/* Account Overview Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800">Account Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Identity Row */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{user?.full_name || '—'}</p>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            </div>
            <BadgePill verified={!!user?.is_email_verified} />
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400 mb-0.5">Username</p>
              <p className="font-medium text-gray-700 truncate">{user?.username || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400 mb-0.5">Role</p>
              <p className="font-medium text-gray-700 capitalize">{user?.role || '—'}</p>
            </div>
          </div>

          {/* Wallet Address */}
          {user?.flow_address && (
            <WalletAddressCard
              address={user.flow_address}
              provider={user.wallet_provider || 'wallet'}
            />
          )}
        </CardContent>
      </Card>

      {/* Profile Form Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name</Label>
              <Input
                id="fullName"
                value={profileData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={profileData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="+234 000 0000 000"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="monthlySavingsTarget" className="text-sm font-medium text-gray-700">Monthly Income Range</Label>
              <Select
                value={profileData.monthlySavingsTarget}
                onValueChange={(value) => handleInputChange('monthlySavingsTarget', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select income range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="below_50k">Below ₦50,000</SelectItem>
                  <SelectItem value="range_50k_100k">₦50,000 – ₦100,000</SelectItem>
                  <SelectItem value="range_100k_200k">₦100,000 – ₦200,000</SelectItem>
                  <SelectItem value="range_200k_350k">₦200,000 – ₦350,000</SelectItem>
                  <SelectItem value="range_350k_500k">₦350,000 – ₦500,000</SelectItem>
                  <SelectItem value="above_500k">Above ₦500,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Savings Goal Card */}
      <Card ref={savingsGoalRef} className="transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800">Savings Goal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="savingAmountGoal" className="text-sm font-medium text-gray-700">Target Amount (₦)</Label>
              <Input
                id="savingAmountGoal"
                value={profileData.savingAmountGoal}
                onChange={(e) => handleInputChange('savingAmountGoal', e.target.value)}
                placeholder="e.g. 500000"
                type="number"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="savingFrequency" className="text-sm font-medium text-gray-700">Saving Frequency</Label>
              <Select
                value={profileData.savingFrequency}
                onValueChange={(value) => handleInputChange('savingFrequency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="savingGoal" className="text-sm font-medium text-gray-700">Goal Purpose</Label>
              <Select
                value={profileData.savingGoal}
                onValueChange={(value) => handleInputChange('savingGoal', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="What are you saving for?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="House Rent">House Rent</SelectItem>
                  <SelectItem value="Emergency Fund">Emergency Fund</SelectItem>
                  <SelectItem value="Investment">Investment</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Car Purchase">Car Purchase</SelectItem>
                  <SelectItem value="Wedding">Wedding</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pb-4">
        <Button
          onClick={handleSaveChanges}
          disabled={isLoading}
          className="min-w-[140px]"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}