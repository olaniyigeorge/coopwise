import ApiService from './api-service'

export interface FeedbackPayload {
  full_name: string
  email: string
  subject: string
  message: string
}

const SupportService = {
  async writeUs(payload: FeedbackPayload) {
    return ApiService.post('/support/write-us', payload)
  },
}

export default SupportService
