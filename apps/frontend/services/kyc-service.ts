import type {
  KYCOverview,
  KYCPersonalInfoInput,
  KYCContactInfoInput,
  KYCIdentityVerificationInput,
  KYCBankingInfoInput,
} from "@/types/kyc"
import type {
  KycSubmissionListParams,
  KycSubmissionListResponse,
  KycSubmissionDetail,
  KycStep,
  RejectPayload,
} from "@/types/kyc-admin"

import ApiService from "@/services/api-service"




const ADMIN_BASE = "/kyc/admin"
const BASE = "/kyc"


export async function startKYC() {
  return ApiService.post(
    `${BASE}/start`
  )
}


export async function getKYCStatus() {
  return ApiService.get(
    `${BASE}/status`
  )
}


export async function getKYCOverview(): Promise<KYCOverview> {
  return ApiService.get<KYCOverview>(
    `${BASE}/summary`
  )
}


export async function submitPersonalInfo(
  data: KYCPersonalInfoInput
) {
  return ApiService.post(
    `${BASE}/personal-info`,
    data
  )
}


export async function submitContactInfo(
  data: KYCContactInfoInput
) {
  return ApiService.post(
    `${BASE}/contact-info`,
    data
  )
}


export async function submitBankingInfo(
  data: KYCBankingInfoInput
) {
  return ApiService.post(
    `${BASE}/banking-info`,
    data
  )
}


// Identity verification uses multipart/form-data
export async function submitIdentityVerification(
  data: KYCIdentityVerificationInput,
  idempotencyKey: string
) {

  const form = new FormData()

  form.append(
    "document_type",
    data.document_type
  )

  form.append(
    "document_number",
    data.document_number
  )


  if (data.document_image_file) {
    form.append(
      "document_image",
      data.document_image_file
    )
  }


  if (data.selfie_image_file) {
    form.append(
      "selfie_image",
      data.selfie_image_file
    )
  }


  if (data.video_file) {
    form.append(
      "video",
      data.video_file
    )
  }


  return ApiService.post(
    `${BASE}/identity-verification`,
    form,
    {
      headers: {
        /**
         * Do not set Content-Type manually.
         *
         * Browser must generate:
         *
         * multipart/form-data; boundary=xxxxx
         *
         */
        "Idempotency-Key": idempotencyKey,
      },
    }
  )
}





function buildAdminQuery(params: KycSubmissionListParams): string {
  const qs = new URLSearchParams()
  if (params.status && params.status !== "all") qs.set("status", params.status)
  if (params.page) qs.set("page", String(params.page))
  if (params.page_size) qs.set("page_size", String(params.page_size))
  if (params.search) qs.set("search", params.search)
  const s = qs.toString()
  return s ? `?${s}` : ""
}

export async function listKycSubmissions(
  params: KycSubmissionListParams = {}
): Promise<KycSubmissionListResponse> {
  return ApiService.get<KycSubmissionListResponse>(
    `${ADMIN_BASE}/submissions${buildAdminQuery(params)}`
  )
}

export async function getKycSubmission(
  kycId: string
): Promise<KycSubmissionDetail> {
  return ApiService.get<KycSubmissionDetail>(`${ADMIN_BASE}/${kycId}`)
}

export async function approveStep(
  kycId: string,
  step: KycStep
): Promise<KycSubmissionDetail> {
  return ApiService.post<KycSubmissionDetail>(
    `${ADMIN_BASE}/${kycId}/steps/${step}/approve`
  )
}

export async function rejectStep(
  kycId: string,
  step: KycStep,
  payload: RejectPayload
): Promise<KycSubmissionDetail> {
  return ApiService.post<KycSubmissionDetail>(
    `${ADMIN_BASE}/${kycId}/steps/${step}/reject`,
    payload
  )
}

export async function finalizeVerified(
  kycId: string
): Promise<KycSubmissionDetail> {
  return ApiService.post<KycSubmissionDetail>(
    `${ADMIN_BASE}/${kycId}/finalize/verify`
  )
}

export async function finalizeRejected(
  kycId: string,
  payload: RejectPayload
): Promise<KycSubmissionDetail> {
  return ApiService.post<KycSubmissionDetail>(
    `${ADMIN_BASE}/${kycId}/finalize/reject`,
    payload
  )
}