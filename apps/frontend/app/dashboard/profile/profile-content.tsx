"use client"

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUserProfile } from '@/lib/hooks/use-user-profile'
import Link from 'next/link'
import { toast } from 'sonner'

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
function RolePill({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
      role!=="admin"
        ? 'bg-green-50 text-green-700 border border-green-200'
        : 'bg-blue-50 text-blue-700 border border-blue-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${role!=='admin' ? 'bg-green-500' : 'bg-blue-400'}`} />
      {role}
    </span>
  )
}

function getFriendlyErrorMessage(error: unknown): string {
  const fieldLabels: Record<string, string> = {
    income_range: "Monthly income range",
    saving_frequency: "Saving frequency",
    target_savings_amount: "Target savings amount",
    full_name: "Full name",
    phone_number: "Phone number",
  }

  // Adjust this shape to match whatever your fetch/axios wrapper actually throws
  const detail = (error as any)?.response?.data?.detail ?? (error as any)?.detail

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0]
    const field = first?.loc?.[first.loc.length - 1]
    const label = fieldLabels[field] || "One of the fields"

    if (first?.type?.includes("enum")) {
      return `${label} has an invalid value. Please choose from the available options.`
    }
    return `${label}: ${first?.msg || "is invalid"}.`
  }

  return "Something went wrong while saving your profile. Please try again."
}


function GoalPurposeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const options = ["Education", "House Rent", "Emergency Fund", "Investment", "Business", "Travel", "Car Purchase", "Wedding", "Other"]
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        id="savingGoal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="What are you saving for?"
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-md max-h-48 overflow-y-auto">
          {options
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()))
            .map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
              >
                {opt}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}


export default function ProfileContent() {
  const { profile, isLoading: isProfileLoading, isUpdating, updateProfile } = useUserProfile()
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
    if (profile) {
      setProfileData({
        fullName: profile.full_name || '',
        phoneNumber: profile.phone_number || '',
        email: profile.email || '',
        monthlySavingsTarget: profile.income_range || '',
        savingAmountGoal: profile.target_savings_amount?.toString() || '',
        savingGoal: profile.savings_purpose || '',
        savingFrequency: profile.saving_frequency || '',
      })
    }
    }, [profile])
  

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
    if (!profileData.monthlySavingsTarget) {
      toast.error("Please select your monthly income range before saving.")
      return
    }

    try {
      await updateProfile(profile!.id, {
        full_name: profileData.fullName,
        phone_number: profileData.phoneNumber,
        target_savings_amount: profileData.savingAmountGoal ? parseFloat(profileData.savingAmountGoal) : 0,
        savings_purpose: profileData.savingGoal || '',
        income_range: profileData.monthlySavingsTarget,
        saving_frequency: profileData.savingFrequency || 'daily',
      })
      toast.success("Profile updated successfully.")
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error))
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
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg shrink-0 overflow-hidden relative">
              {profile?.profile_picture_url ? (
                <Image
                    src={profile.profile_picture_url}
                    alt={profile.full_name || 'Profile picture'}
                    fill
                    className="object-cover"
                  />
                ) : (
                profile?.full_name?.charAt(0)?.toUpperCase() ||
                profile?.email?.charAt(0)?.toUpperCase() ||
                '?'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{profile?.full_name || '—'}</p>
              <p className="text-sm text-gray-500 truncate">{profile?.email}</p>
            </div>

            {/* <RolePill role={profile!.role} /> */}
            <BadgePill verified={!!profile?.is_email_verified} />
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400 mb-0.5">Username</p>
              <p className="font-medium text-gray-700 truncate">{profile?.username || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400 mb-0.5">Email</p>
              <p className="font-medium text-gray-700 truncate">{profile?.email || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400 mb-0.5">Sign-in method</p>
              <p className="font-medium text-gray-700 truncate">
                {profile?.firebase_uid ? 'Google / Firebase' : 'Email & password'}
              </p>
            </div>
            <div className={`bg-gray-50 rounded-lg px-3 py-2 border ${profile?.is_kyc_verified ? "border-green-600" : "border-brand-gold"}`}>
              <p className="text-xs text-gray-400 mb-0.5">KYC status</p>
              {profile?.is_kyc_verified ?
                <p className="font-medium text-green-600 truncate">
                   Verified
                </p>
                :
                 <Link href="/dashboard/kyc" className="font-medium text-brand-gold truncate">
                   Not verified
                </Link>
              }
            </div>
          </div>

          {/* Wallet Address */}
          {profile?.flow_address && (
            <WalletAddressCard
              address={profile.flow_address}
              provider={profile.wallet_provider || 'wallet'}
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
              <GoalPurposeInput
                value={profileData.savingGoal}
                onChange={(v) => handleInputChange('savingGoal', v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pb-4">
        <Button
          onClick={handleSaveChanges}
          disabled={isUpdating || isProfileLoading}
          className="min-w-[140px]"
        >
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}