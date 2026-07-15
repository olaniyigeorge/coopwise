import type {
  KYCOverview,
  KYCPersonalInfoInput,
  KYCContactInfoInput,
  KYCIdentityVerificationInput,
  KYCBankingInfoInput,
} from "@/types/kyc"

// TODO: point BASE at your real FastAPI router prefix for the kyc domain
// (e.g. `${process.env.NEXT_PUBLIC_API_URL}/kyc`). Using a relative path for now.
const BASE = '/api/v1/kyc'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`KYC request failed (${res.status}): ${body}`)
  }
  return res.json()
}

export async function getKYCOverview(): Promise<KYCOverview> {
  // TODO: wire to GET /kyc — returning a "not started" shape as a safe placeholder
  // so the overview page has something sane to render before the backend is connected.
  try {
    return await request<KYCOverview>('')
  } catch {
    return {
      status: 'not_started',
      current_step: 'personal_info',
      stages: [
        { step: 'personal_info', status: 'pending' },
        { step: 'contact_info', status: 'pending' },
        { step: 'identity_verification', status: 'pending' },
        { step: 'banking_info', status: 'pending' },
      ],
    }
  }
}

export async function submitPersonalInfo(data: KYCPersonalInfoInput) {
  return request('/personal-info', { method: 'POST', body: JSON.stringify(data) })
}

export async function submitContactInfo(data: KYCContactInfoInput) {
  return request('/contact-info', { method: 'POST', body: JSON.stringify(data) })
}

export async function submitBankingInfo(data: KYCBankingInfoInput) {
  return request('/banking-info', { method: 'POST', body: JSON.stringify(data) })
}

// Identity verification carries files, so it goes over multipart/form-data
// instead of the shared JSON `request` helper.
export async function submitIdentityVerification(data: KYCIdentityVerificationInput) {
  const form = new FormData()
  form.append('document_type', data.document_type)
  form.append('document_number', data.document_number)
  if (data.document_image_file) form.append('document_image', data.document_image_file)
  if (data.selfie_image_file) form.append('selfie_image', data.selfie_image_file)
  if (data.video_file) form.append('video', data.video_file)

  const res = await fetch(`${BASE}/identity-verification`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`KYC identity submission failed (${res.status}): ${body}`)
  }
  return res.json()
}