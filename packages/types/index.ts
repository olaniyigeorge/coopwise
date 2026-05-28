/**
 * @package @coopwise/types
 *
 * Shared type definitions consumed by:
 *   - apps/frontend  (API response shapes, domain entities)
 *   - apps/backend   (via Python dataclasses / Pydantic — use as reference)
 *   - apps/mobile    (when built)
 *
 * Rule: if a type describes a shape that crosses the API boundary,
 * it belongs here. Frontend-only UI state types stay in apps/frontend/types/.
 */

// ─────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────

export type UUID = string;
export type ISODateString = string; // "2025-01-15T10:30:00Z"
export type CurrencyCode = "NGN" | "GHS" | "KES" | "ZAR" | "USD";
export type StableCoin = "usdc" | "usdt" | "cusd" | "dai";

// ─────────────────────────────────────────────
// API envelope
// ─────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: "success" | "error";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface ApiError {
  detail: string;
  code?: string;
  field?: string; // for validation errors
}

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  full_name: string;
}

// ─────────────────────────────────────────────
// User
// ─────────────────────────────────────────────

export interface User {
  id: UUID;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone_number: string | null;
  country: string | null;
  local_currency: CurrencyCode;
  is_verified: boolean;
  created_at: ISODateString;
}

export interface UserProfile extends User {
  wallet_balance: number;
  total_contributions: number;
  circles_count: number;
}

// ─────────────────────────────────────────────
// Circle (Cooperative Group)
// ─────────────────────────────────────────────

export type CircleStatus = "active" | "paused" | "completed" | "disbanded";
export type ContributionFrequency = "daily" | "weekly" | "biweekly" | "monthly";
export type PayoutOrder = "fixed" | "random" | "vote";

export interface Circle {
  id: UUID;
  name: string;
  description: string | null;
  contribution_amount: number;
  local_currency: CurrencyCode;
  stable_amount: number;
  stable_currency: StableCoin;
  frequency: ContributionFrequency;
  payout_order: PayoutOrder;
  max_members: number;
  current_members: number;
  status: CircleStatus;
  round_number: number;
  total_rounds: number;
  invite_code: string;
  is_private: boolean;
  created_by: UUID;
  created_at: ISODateString;
  next_contribution_date: ISODateString | null;
  next_payout_date: ISODateString | null;
}

export interface CircleDetail extends Circle {
  members: Membership[];
  my_membership: Membership | null;
}

export interface CreateCircleRequest {
  name: string;
  description?: string;
  contribution_amount: number;
  local_currency: CurrencyCode;
  frequency: ContributionFrequency;
  payout_order: PayoutOrder;
  max_members: number;
  is_private?: boolean;
}

// ─────────────────────────────────────────────
// Membership
// ─────────────────────────────────────────────

export type MembershipStatus = "active" | "pending" | "suspended" | "exited";
export type MemberRole = "admin" | "member";

export interface Membership {
  id: UUID;
  user_id: UUID;
  circle_id: UUID;
  role: MemberRole;
  status: MembershipStatus;
  payout_position: number | null;
  has_received_payout: boolean;
  joined_at: ISODateString;
  user: Pick<User, "id" | "full_name" | "avatar_url">;
}

// ─────────────────────────────────────────────
// Contributions
// ─────────────────────────────────────────────

export type ContributionStatus = "pending" | "confirmed" | "failed" | "reversed";

export interface Contribution {
  id: UUID;
  user_id: UUID;
  circle_id: UUID;
  round_number: number;
  amount: number;
  local_currency: CurrencyCode;
  stable_amount: number;
  stable_currency: StableCoin;
  status: ContributionStatus;
  tx_id: string | null;
  created_at: ISODateString;
}

// ─────────────────────────────────────────────
// Payments / Wallet Ledger
// ─────────────────────────────────────────────

export type LedgerType = "deposit" | "withdrawal" | "contribution" | "refund";
export type LedgerStatus = "initiated" | "pending" | "settled" | "failed";
export type PaymentGateway =
  | "paystack"
  | "flutterwave"
  | "cashramp"
  | "on_chain_cashramp"
  | "on_chain_solana"
  | "coopwise_network"
  | "cash";

export interface WalletLedgerEntry {
  id: UUID;
  reference: string;
  wallet_id: UUID;
  contribution_id: UUID | null;
  type: LedgerType;
  stable_amount: number;
  stable_currency: StableCoin;
  local_amount: number;
  local_currency: CurrencyCode;
  exchange_rate: number;
  gateway: PaymentGateway;
  status: LedgerStatus;
  provider_reference: string | null; // Paystack / Flutterwave txn ID
  tx_hash: string | null;            // Solana / EVM tx hash
  chain_id: string | null;           // "solana" | "base" | "celo"
  note: string | null;
  created_at: ISODateString;
}

// ─────────────────────────────────────────────
// Wallet
// ─────────────────────────────────────────────

export interface Wallet {
  id: UUID;
  user_id: UUID;
  balance: number;
  stable_balance: number;
  stable_currency: StableCoin;
  local_currency: CurrencyCode;
  wallet_address: string | null; // on-chain address
  created_at: ISODateString;
}

export interface WalletWithHistory extends Wallet {
  ledger: WalletLedgerEntry[];
}

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────

export type NotificationType =
  | "contribution_due"
  | "contribution_confirmed"
  | "payout_received"
  | "member_joined"
  | "member_left"
  | "circle_completed"
  | "system";

export interface Notification {
  id: UUID;
  user_id: UUID;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: ISODateString;
}

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────

export interface DashboardOverview {
  wallet_balance: number;
  local_currency: CurrencyCode;
  total_contributed: number;
  total_received: number;
  active_circles: number;
  next_contribution: {
    circle_name: string;
    amount: number;
    due_date: ISODateString;
  } | null;
  next_payout: {
    circle_name: string;
    amount: number;
    payout_date: ISODateString;
  } | null;
  recent_activity: WalletLedgerEntry[];
}

// ─────────────────────────────────────────────
// AI / Insights
// ─────────────────────────────────────────────

export interface AiInsight {
  id: UUID;
  user_id: UUID;
  title: string;
  summary: string;
  insight_type: "savings_tip" | "contribution_pattern" | "risk_alert" | "milestone";
  confidence_score: number; // 0–1
  metadata: Record<string, unknown> | null;
  created_at: ISODateString;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: ISODateString;
}