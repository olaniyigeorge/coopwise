export const KYC_STEPS = [
  "personal_info",
  "contact_info",
  "identity_verification",
  "banking_info",
] as const;

export type KycStep = (typeof KYC_STEPS)[number];

export const KYC_STEP_LABELS: Record<KycStep, string> = {
  personal_info: "Personal information",
  contact_info: "Contact information",
  identity_verification: "Identity verification",
  banking_info: "Banking information",
};

// Mirrors backend KYCStatus
export type KycSubmissionStatus =
  | "not_started"
  | "in_progress"
  | "pending_review"
  | "verified"
  | "rejected"
  | "expired";

// Mirrors backend KYCStepStatus
export type KycStepStatus = "pending" | "submitted" | "approved" | "rejected";

export interface KycStepRecord {
  step: KycStep;
  status: KycStepStatus;
  // Only identity_verification is expected to carry a document; the other
  // three steps are form submissions. `submitted_data` covers those — a
  // flat key/value dump is rendered as-is. Adjust the shape here once the
  // real detail-endpoint response for these steps is confirmed.
  document_url?: string | null;
  submitted_data?: Record<string, string | number | boolean | null> | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  rejection_reason?: string | null;
}

// Row shape for GET /kyc/admin/submissions
export interface KycSubmissionListItem {
  kyc_id: string;
  user_id: string;
  user_email: string | null;
  legal_full_name: string;
  status: KycSubmissionStatus;
  current_step: string | null;
  personal_info_status: KycStepStatus;
  contact_info_status: KycStepStatus;
  identity_status: KycStepStatus;
  banking_status: KycStepStatus;
  full_name_match_score: number | null;
  submitted_at: string | null;
  updated_at: string;
}

export interface KycSubmissionListResponse {
  items: KycSubmissionListItem[];
  total: number;
  page: number;
  page_size: number;
}

// Shape for GET /kyc/admin/{kyc_id}
export interface KycSubmissionDetail {
  kyc_id: string;
  user_id: string;
  user_email: string | null;
  status: KycSubmissionStatus;
  personal_info: any;
  contact_info: any;
  identity_verification: any;
  banking_info: any;
  audit_log: []
}

export interface KycSubmissionListParams {
  status?: KycSubmissionStatus | "all";
  page?: number;
  page_size?: number;
  search?: string;
}

export interface RejectPayload {
  reason: string;
}