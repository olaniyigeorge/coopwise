import { useState, useEffect, useCallback } from 'react'
import UserService, { UserProfile, UpdateUserPayload } from '@/services/user-service'
import { toast } from 'sonner'

interface UseUserProfileReturn {
  profile: UserProfile | null
  isLoading: boolean
  isUpdating: boolean
  error: string | null
  refetch: () => Promise<void>
  updateProfile: (userId: string, updates: UpdateUserPayload) => Promise<boolean>
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

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await UserService.getProfile()
      setProfile(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateProfile = useCallback(
    async (userId: string, updates: UpdateUserPayload) => {
      if (!profile) {
        setError('Profile has not loaded yet')
        return false
      }

      setIsUpdating(true)
      setError(null)

      // Merge with current profile so a partial edit still satisfies
      // a backend that expects the full object on PATCH.
      const payload: UpdateUserPayload = { ...profile, ...updates }

      try {
        const updated = await UserService.updateProfile(userId, payload)
        setProfile(updated)
        toast.success('Profile updated successfully!', {
          description: 'Your changes have been saved.',
        })
        return true
      } catch (err: any) {
        const message = err?.message || 'Failed to update your profile'
        setError(message)
        toast.error(getFriendlyErrorMessage(err))
        return false
      } finally {
        setIsUpdating(false)
      }
    },
    [profile]
  )

  return { profile, isLoading, isUpdating, error, refetch: fetchProfile, updateProfile }
}