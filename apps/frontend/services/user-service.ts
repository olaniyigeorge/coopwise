import ApiService from './api-service'

export interface UserProfile {
  id: string
  username: string
  email: string
  full_name: string
  phone_number: string
  profile_picture_url: string | null

  role: string
  firebase_uid: string | null

  // Crossmint / Web3 identity — read-only, provisioned server-side
  crossmint_user_id: string | null
  flow_address: string | null
  wallet_provider: string | null
  wallet_activated: boolean

  // Onboarding & preferences
  target_savings_amount: number | null
  savings_purpose: string | null
  income_range: string | null
  saving_frequency: string | null

  // Verification flags — read-only
  is_email_verified: boolean
  is_phone_verified: boolean
  is_kyc_verified: boolean

  created_at: string
  updated_at: string
}

/**
 * Fields the user is actually allowed to submit on PATCH /users/me.
 *
 * Deliberately excluded:
 * - password        -> never fetched, never patched through this endpoint
 * - id / role       -> resolved server-side from the session, not client input
 * - firebase_uid    -> identity binding, not user-editable
 * - crossmint_user_id / flow_address / wallet_provider / wallet_activated
 *                   -> provisioned by the wallet flow, read-only here
 * - is_*_verified   -> only verification flows can flip these
 * - created_at/updated_at -> server-managed timestamps
 */
export type UpdateUserPayload = Partial<
  Pick<
    UserProfile,
    | 'username'
    | 'email'
    | 'full_name'
    | 'phone_number'
    | 'target_savings_amount'
    | 'savings_purpose'
    | 'income_range'
    | 'saving_frequency'
  >
>

function formatUpdatePayload(payload: UpdateUserPayload): UpdateUserPayload {
  const formatted: UpdateUserPayload = { ...payload }

  if (formatted.target_savings_amount !== undefined) {
    const numeric = Number(formatted.target_savings_amount)
    formatted.target_savings_amount = isNaN(numeric) ? 0 : numeric
  }

  return formatted
}

const UserService = {
  /**
   * Fetches the current user's profile. Identity is resolved server-side
   * from the httpOnly session cookie — no id/token is ever handled client-side.
   * Password is never part of this response.
   */
  async getProfile(): Promise<UserProfile> {
    return ApiService.get<UserProfile>('/users/me')
  },

  /**
   * Updates the current user's profile. Only fields in UpdateUserPayload
   * are accepted — see the type for what's intentionally excluded.
   */
  async updateProfile(userId: string, data: UpdateUserPayload): Promise<UserProfile> {
    const formattedData = formatUpdatePayload(data)
    return ApiService.patch<UserProfile>(`/users/${userId}`, formattedData)
  },
}

export default UserService