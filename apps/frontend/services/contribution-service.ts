import ApiService from './api-service'

export interface ContributionCreatePayload {
  group_id: string
  amount: number
  goal_id?: string | null
  currency?: string
  note?: string
}

export interface ContributionDetail {
  id: string
  user_id: string
  group_id: string
  goal_id: string | null
  amount: number
  currency: string
  due_date: string | null
  fulfilled_at: string | null
  note: string | null
  status: 'pledged' | 'initiated' | 'pending' | 'completed' | 'failed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface GoalProgress {
  goal_id: string
  target_amount: number | null
  currency: string
  contributed_amount: number
  percent_complete: number | null
  contributor_count: number
}

const ContributionService = {
  async contribute(payload: ContributionCreatePayload) {
    return ApiService.post<{ message: string; contribution: ContributionDetail }>(
      '/contributions',
      payload
    )
  },

  /**
   * Starts a contribution paid directly through Paystack (wallet not
   * involved). Redirect the browser to `authorization_url`; the contribution
   * completes server-side once Paystack confirms payment.
   */
  async initiatePaystack(payload: ContributionCreatePayload) {
    return ApiService.post<{
      message: string
      contribution: ContributionDetail
      reference: string
      authorization_url: string
    }>('/contributions/paystack/initiate', payload)
  },

  async getGroupContributions(groupId: string) {
    return ApiService.get<ContributionDetail[]>(`/contributions/group/${groupId}`)
  },

  async getGoalProgress(goalId: string) {
    return ApiService.get<GoalProgress>(`/contributions/goals/${goalId}/progress`)
  },
}

export default ContributionService
