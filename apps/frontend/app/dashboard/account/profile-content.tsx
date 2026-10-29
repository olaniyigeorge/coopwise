"use client"

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  AtSign,
  BadgeCheck,
  Check,
  Copy,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
} from 'lucide-react'

import { UserAvatar } from '@/components/ui/user-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUserProfile } from '@/lib/hooks/use-user-profile'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getApiErrorDetail } from '@/lib/api-error'
import { uploadAvatar } from '@/services/onboarding-service'
import useAuthStore from '@/stores/auth-store'

interface ProfileData {
  fullName: string
  phoneNumber: string
  email: string
  monthlySavingsTarget: string
  savingAmountGoal: string
  savingGoal: string
  savingFrequency: string
}

const fieldClassName =
  'h-11 rounded-2xl border-content/10 bg-content/[0.02] text-sm text-content placeholder:text-content/30 focus-visible:border-[#0E3B2E]/40 focus-visible:ring-2 focus-visible:ring-[#0E3B2E]/15 dark:focus-visible:border-[#7FBF9C]/40 dark:focus-visible:ring-[#7FBF9C]/20'

const labelClassName =
  'text-[11px] font-semibold uppercase tracking-[0.16em] text-content/45'

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string
  description?: string
  icon: React.ElementType
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-[24px] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)] sm:p-6',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold tracking-tight text-content">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-content/45">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function MetaItem({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ElementType
  label: string
  value?: string | null
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-content/[0.07] bg-content/[0.02] px-4 py-3">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-content/40">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      {children ?? (
        <p className="mt-1 truncate text-sm font-semibold text-content">
          {value || '—'}
        </p>
      )}
    </div>
  )
}

function WalletAddressCard({ address, provider }: { address: string; provider: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const short = `${address.slice(0, 6)}…${address.slice(-6)}`

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-content/[0.07] bg-content/[0.02] px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]">
        <Wallet className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-content/40 capitalize">
          {provider} wallet
        </p>
        <p className="truncate font-mono text-sm text-content">{short}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        title="Copy full address"
        aria-label="Copy wallet address"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-content/45 transition-colors hover:bg-content/[0.05] hover:text-content"
      >
        {copied ? (
          <Check className="h-4 w-4 text-[#17603F] dark:text-[#7FBF9C]" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}

function VerifiedPill({ verified }: { verified: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
        verified
          ? 'bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]'
          : 'bg-[#FBF1D0] text-[#8A6516] dark:bg-[#3A3120] dark:text-[#E8BC63]'
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          verified ? 'bg-[#17603F] dark:bg-[#7FBF9C]' : 'bg-[#B8892B]'
        )}
      />
      {verified ? 'Verified' : 'Unverified'}
    </span>
  )
}

function GoalPurposeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const options = [
    'Education',
    'House Rent',
    'Emergency Fund',
    'Investment',
    'Business',
    'Travel',
    'Car Purchase',
    'Wedding',
    'Other',
  ]
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        id="savingGoal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="What are you saving for?"
        autoComplete="off"
        className={fieldClassName}
      />
      {open && (
        <div className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-2xl border border-content/10 bg-surface p-1.5 shadow-[0_18px_40px_-20px_rgba(11,23,18,0.35)]">
          {options
            .filter((option) =>
              option.toLowerCase().includes(value.toLowerCase())
            )
            .map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option)
                  setOpen(false)
                }}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm text-content/80 transition-colors hover:bg-content/[0.05] hover:text-content"
              >
                {option}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

export default function ProfileContent() {
  const { profile, isLoading: isProfileLoading, isUpdating, updateProfile, refetch } =
    useUserProfile()
  const searchParams = useSearchParams()
  const focusSection = searchParams.get('focus')
  const savingsGoalRef = useRef<HTMLDivElement>(null)

  const updateUser = useAuthStore((state) => state.updateUser)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    phoneNumber: '',
    email: '',
    monthlySavingsTarget: '',
    savingAmountGoal: '',
    savingGoal: '',
    savingFrequency: '',
  })

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
        savingsGoalRef.current?.classList.add('ring-2', 'ring-[#7FBF9C]/50')
        setTimeout(() => {
          savingsGoalRef.current?.classList.remove('ring-2', 'ring-[#7FBF9C]/50')
        }, 2000)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [focusSection])

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveChanges = async () => {
    if (!profileData.monthlySavingsTarget) {
      toast.error('Please select your monthly income range before saving.')
      return
    }
    await updateProfile(profile!.id, {
      full_name: profileData.fullName,
      phone_number: profileData.phoneNumber,
      target_savings_amount: profileData.savingAmountGoal
        ? parseFloat(profileData.savingAmountGoal)
        : 0,
      savings_purpose: profileData.savingGoal || '',
      income_range: profileData.monthlySavingsTarget,
      saving_frequency: profileData.savingFrequency || 'daily',
    })
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !profile?.id) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Use a JPEG, PNG, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('That image is larger than 5MB.')
      return
    }

    setAvatarPreview(URL.createObjectURL(file))
    setAvatarUploading(true)
    try {
      const result = await uploadAvatar(profile.id, file)
      setAvatarPreview(result.profile_picture_url)
      updateUser({ profile_picture_url: result.profile_picture_url })
      await refetch()
      toast.success('Profile photo updated')
    } catch (error) {
      setAvatarPreview(null)
      const detail = getApiErrorDetail(error)
      toast.error(
        typeof detail === 'string' ? detail : 'Could not update your photo.'
      )
    } finally {
      setAvatarUploading(false)
    }
  }

  const displayName = profile?.full_name || profile?.username || 'Your profile'
  const kycVerified = !!profile?.is_kyc_verified

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-content/40">
          Account
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-content sm:text-4xl">
          Your profile
        </h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-content/50">
          How you show up across CoopWise, and the plan that shapes your saving
          rhythm.
        </p>
      </header>

      {focusSection === 'savings-goal' && (
        <div className="flex items-start gap-3 rounded-[20px] border border-[#EAD9AC] bg-[#FBF3DE] p-4 dark:border-[#5A4A22] dark:bg-[#2E2818]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-[#8A6516] dark:bg-white/10 dark:text-[#E8BC63]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#6B4E12] dark:text-[#E8BC63]">
              Update your savings goal
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#8A6516]/80 dark:text-[#E8BC63]/70">
              The Savings plan section below is highlighted — set your target,
              purpose and frequency there.
            </p>
          </div>
        </div>
      )}

      {/* Identity hero */}
      <section className="overflow-hidden rounded-[24px] bg-surface shadow-[0_1px_2px_rgba(11,23,18,0.04)]">
        <div className="relative h-24 bg-gradient-to-br from-[#0E3B2E] via-[#17603F] to-[#1F7A54]">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_45%)]"
          />
        </div>
        <div className="px-5 pb-5 sm:px-6">
          <div className="relative z-10 -mt-9 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="relative">
                <UserAvatar
                  name={displayName}
                  src={avatarPreview || profile?.profile_picture_url}
                  size="lg"
                  className="h-20 w-20 shrink-0 rounded-3xl border-4 border-surface shadow-sm"
                fallbackClassName="bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading || !profile?.id}
                  aria-label="Change profile photo"
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-[#0E3B2E] text-white shadow-sm transition-colors hover:bg-[#0A2E24] disabled:opacity-60"
                >
                  {avatarUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Pencil className="h-3.5 w-3.5" />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="min-w-0 pb-1">
                <h2 className="truncate font-display text-xl font-bold tracking-tight text-content">
                  {profile?.full_name || '—'}
                </h2>
                <p className="mt-0.5 truncate text-sm text-content/50">
                  {profile?.email}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 pb-1">
              <VerifiedPill verified={!!profile?.is_email_verified} />
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                  kycVerified
                    ? 'bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]'
                    : 'bg-content/[0.05] text-content/45'
                )}
              >
                <ShieldCheck className="h-3 w-3" />
                {kycVerified ? 'KYC verified' : 'KYC pending'}
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <MetaItem icon={AtSign} label="Username" value={profile?.username} />
            <MetaItem icon={Mail} label="Email" value={profile?.email} />
            <MetaItem
              icon={Wallet}
              label="Sign-in"
              value={profile?.firebase_uid ? 'Google / Firebase' : 'Email & password'}
            />
          </div>

          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <MetaItem icon={BadgeCheck} label="KYC status">
              {kycVerified ? (
                <p className="mt-1 text-sm font-semibold text-[#17603F] dark:text-[#7FBF9C]">
                  Verified
                </p>
              ) : (
                <Link
                  href="/dashboard/kyc"
                  className="mt-1 inline-block text-sm font-semibold text-[#8A6516] underline-offset-2 hover:underline dark:text-[#E8BC63]"
                >
                  Not verified — verify now
                </Link>
              )}
            </MetaItem>
            {profile?.flow_address ? (
              <WalletAddressCard
                address={profile.flow_address}
                provider={profile.wallet_provider || 'wallet'}
              />
            ) : (
              <MetaItem
                icon={Wallet}
                label="Wallet"
                value="No wallet linked yet"
              />
            )}
          </div>
        </div>
      </section>

      {profile?.role?.toLowerCase() === 'admin' && (
        <section className="flex flex-col gap-3 rounded-[24px] border border-[#B8892B]/20 bg-[#FBF3DE] p-5 dark:border-[#B8892B]/30 dark:bg-[#2E2818] sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-semibold text-[#6B4E12] dark:text-[#E8BC63]">Admin tools</p>
            <p className="mt-1 text-xs text-[#8A6516]/80 dark:text-[#E8BC63]/70">Review member KYC submissions and verification status.</p>
          </div>
          <Link
            href="/dashboard/admin/kyc"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0E3B2E] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0A2E24] dark:bg-[#7FBF9C] dark:text-[#0B1712]"
          >
            Open KYC review
          </Link>
        </section>
      )}

      {/* Personal information */}
      <SectionCard
        title="Personal information"
        description="Your name and contact details as other members see them."
        icon={Phone}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName" className={labelClassName}>
              Full name
            </Label>
            <Input
              id="fullName"
              value={profileData.fullName}
              onChange={(event) => handleInputChange('fullName', event.target.value)}
              placeholder="Your full name"
              className={fieldClassName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className={labelClassName}>
              Phone number
            </Label>
            <Input
              id="phoneNumber"
              value={profileData.phoneNumber}
              onChange={(event) => handleInputChange('phoneNumber', event.target.value)}
              placeholder="+234 000 0000 000"
              className={fieldClassName}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="monthlySavingsTarget" className={labelClassName}>
              Monthly income range
            </Label>
            <Select
              value={profileData.monthlySavingsTarget}
              onValueChange={(value) => handleInputChange('monthlySavingsTarget', value)}
            >
              <SelectTrigger className={fieldClassName}>
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
      </SectionCard>

      {/* Savings plan */}
      <div ref={savingsGoalRef} className="scroll-mt-24 rounded-[24px] transition-all duration-300">
        <SectionCard
          title="Savings plan"
          description="What you're putting aside, how often, and what for."
          icon={Target}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="savingAmountGoal" className={labelClassName}>
                Target amount (₦)
              </Label>
              <Input
                id="savingAmountGoal"
                value={profileData.savingAmountGoal}
                onChange={(event) =>
                  handleInputChange('savingAmountGoal', event.target.value)
                }
                placeholder="e.g. 500000"
                type="number"
                className={fieldClassName}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="savingFrequency" className={labelClassName}>
                Saving frequency
              </Label>
              <Select
                value={profileData.savingFrequency}
                onValueChange={(value) => handleInputChange('savingFrequency', value)}
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="savingGoal" className={labelClassName}>
                Goal purpose
              </Label>
              <GoalPurposeInput
                value={profileData.savingGoal}
                onChange={(value) => handleInputChange('savingGoal', value)}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-content/[0.06] pt-5">
            <p className="text-xs text-content/40">
              Changes apply to your personal saving plan across the dashboard.
            </p>
            <Button
              onClick={handleSaveChanges}
              disabled={isUpdating || isProfileLoading}
              className="h-11 min-w-[150px] rounded-full bg-[#0E3B2E] px-5 text-sm font-semibold text-white hover:bg-[#0A2E24] dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:hover:bg-[#93CBAE]"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
