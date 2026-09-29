import ApiService from './api-service'

/** How a cooperative admits people who ask to join. */
export type AdmissionMode = 'automatic' | 'admin_approval' | 'member_vote'

export interface Application {
  membership_id: string
  group_id: string
  applicant: {
    id: string
    username: string
    full_name: string
    profile_picture_url: string | null
  }
  status: 'pending' | 'active' | 'rejected' | string
  mode: AdmissionMode
  approvals: number
  rejections: number
  eligible_voters: number
  quorum_pct: number
  threshold_pct: number
  /** Whether *you* may approve/reject (admin mode) or vote (vote mode) right now. */
  can_decide: boolean
  /** Your vote so far, if this cooperative decides by member vote. */
  my_vote: boolean | null
  applied_at: string | null
}

const MembershipService = {
  async getApplications(groupId: string) {
    return ApiService.get<Application[]>(`/memberships/groups/${groupId}/applications`)
  },

  async decide(membershipId: string, approve: boolean) {
    return ApiService.post<Application>(`/memberships/applications/${membershipId}/decision`, { approve })
  },
}

export default MembershipService
