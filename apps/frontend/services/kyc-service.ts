import type {
  KYCOverview,
  KYCPersonalInfoInput,
  KYCContactInfoInput,
  KYCIdentityVerificationInput,
  KYCBankingInfoInput,
} from "@/types/kyc"

import ApiService from "@/services/api-service"


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