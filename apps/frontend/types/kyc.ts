export type KYCStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending_review'
  | 'verified'
  | 'rejected'
  | 'expired'

export type KYCStepStatus = 'pending' | 'submitted' | 'approved' | 'rejected'

export type KYCStepType =
  | 'personal_info'
  | 'contact_info'
  | 'identity_verification'
  | 'banking_info'

export type EmploymentStatus =
  | 'employed'
  | 'self_employed'
  | 'business_owner'
  | 'unemployed'
  | 'student'
  | 'retired'

export type SourceOfFunds =
  | 'salary'
  | 'business_income'
  | 'investments'
  | 'gifts'
  | 'inheritance'
  | 'savings'
  | 'other'

export type KYCIdDocumentType =
  | 'nin'
  | 'bvn'
  | 'passport'
  | 'drivers_licence'
  | 'voters_card'

export const EMPLOYMENT_STATUS_OPTIONS: { value: EmploymentStatus; label: string }[] = [
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'business_owner', label: 'Business owner' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'student', label: 'Student' },
  { value: 'retired', label: 'Retired' },
]

export const SOURCE_OF_FUNDS_OPTIONS: { value: SourceOfFunds; label: string }[] = [
  { value: 'salary', label: 'Salary' },
  { value: 'business_income', label: 'Business income' },
  { value: 'investments', label: 'Investments' },
  { value: 'gifts', label: 'Gifts' },
  { value: 'inheritance', label: 'Inheritance' },
  { value: 'savings', label: 'Savings' },
  { value: 'other', label: 'Other' },
]

// TODO: replace with the real IncomeRange enum values from users.models
export const MONTHLY_INCOME_RANGE_OPTIONS = [
  { value: 'under_50000', label: 'Under ₦50,000' },
  { value: '50000_150000', label: '₦50,000 – ₦150,000' },
  { value: '150000_400000', label: '₦150,000 – ₦400,000' },
  { value: '400000_1000000', label: '₦400,000 – ₦1,000,000' },
  { value: 'over_1000000', label: 'Over ₦1,000,000' },
]

export const INCOME_CURRENCY_OPTIONS = ['NGN', 'KES', 'GHS', 'ZAR', 'USD']

export const ID_DOCUMENT_TYPE_OPTIONS: { value: KYCIdDocumentType; label: string }[] = [
  { value: 'nin', label: 'National Identification Number (NIN)' },
  { value: 'bvn', label: 'Bank Verification Number (BVN)' },
  { value: 'passport', label: 'International Passport' },
  { value: 'drivers_licence', label: "Driver's Licence" },
  { value: 'voters_card', label: "Voter's Card" },
]

export interface KYCPersonalInfoInput {
  legal_full_name: string
  date_of_birth: string // yyyy-mm-dd
  gender?: string
  nationality: string
  employment_status: EmploymentStatus | ''
  occupation_or_business_type?: string
  source_of_funds: SourceOfFunds | ''
  monthly_income_range?: string
  income_currency: string
}

export interface KYCContactInfoInput {
  residential_address: string
  city: string
  state: string
  postal_code: string
  country: string
  next_of_kin_name?: string
  next_of_kin_phone?: string
}

export interface KYCIdentityVerificationInput {
  document_type: KYCIdDocumentType | ''
  document_number: string
  document_image_file: File | null
  selfie_image_file: File | null
  video_file: File | null
}

export interface KYCBankingInfoInput {
  bank_name: string
  bank_code: string
  account_number: string
  account_name: string
}

export interface KYCStageSummary {
  step: KYCStepType
  status: KYCStepStatus
  submitted_at: string
  rejection_reason?: string | null
}

export interface KYCOverview {
  overall_status: KYCStatus
  current_step: KYCStepType | null
  total_steps: number
  steps: KYCStageSummary[] // always length 4, in stage order
}

export const STAGE_ORDER: { step: KYCStepType; label: string; title: string }[] = [
  { step: 'personal_info', label: 'Stage 1', title: 'Personal Profile' },
  { step: 'contact_info', label: 'Stage 2', title: 'Contact & Address' },
  { step: 'identity_verification', label: 'Stage 3', title: 'Identity Verification' },
  { step: 'banking_info', label: 'Stage 4', title: 'Banking Information' },
]