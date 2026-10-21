import ApiService from "@/services/api-service"

export type PayoutStatus = "pending" | "processing" | "completed" | "failed"

export interface MyPayout {
  id: string
  group_id: string
  group_name: string
  round_number: number
  amount: number
  currency: string
  status: PayoutStatus
  failure_reason: string | null
  created_at: string
  completed_at: string | null
}

export interface UpcomingPayout {
  group_id: string
  group_name: string
  strategy: "rotating" | "equal" | "priority" | string
  trigger: "automatic" | "admin"
  is_my_turn: boolean
  next_recipient_name: string | null
  payable_amount: number | null
  currency: string
  round_number: number
  funded: boolean
  inflight: boolean
  can_trigger: boolean
}

const PayoutService = {
  async listMine() {
    return ApiService.get<MyPayout[]>("/payments/payouts/me")
  },

  async listUpcoming() {
    return ApiService.get<UpcomingPayout[]>("/payments/payouts/upcoming")
  },

  async trigger(groupId: string) {
    return ApiService.post<unknown>(`/payments/payouts/${groupId}/execute`)
  },
}

export default PayoutService
