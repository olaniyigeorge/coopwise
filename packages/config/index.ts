/**
 * @package @coopwise/config
 *
 * Shared configuration constants consumed across the monorepo.
 * Values here are non-secret, environment-agnostic defaults.
 *
 * Secret values (API keys, connection strings) never live here —
 * those come from environment variables in each app.
 */

// ─────────────────────────────────────────────
// App identity
// ─────────────────────────────────────────────

export const APP_NAME = "Coopwise";
export const APP_TAGLINE = "Save together. Grow together.";
export const APP_VERSION = "0.1.0";

// ─────────────────────────────────────────────
// Supported currencies
// ─────────────────────────────────────────────

export const SUPPORTED_CURRENCIES = ["NGN", "GHS", "KES", "ZAR", "USD"] as const;

export const CURRENCY_LABELS: Record<string, string> = {
  NGN: "Nigerian Naira",
  GHS: "Ghanaian Cedi",
  KES: "Kenyan Shilling",
  ZAR: "South African Rand",
  USD: "US Dollar",
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  GHS: "₵",
  KES: "KSh",
  ZAR: "R",
  USD: "$",
};

// ─────────────────────────────────────────────
// Stable coins
// ─────────────────────────────────────────────

export const SUPPORTED_STABLE_COINS = ["usdc", "usdt", "cusd", "dai"] as const;

export const STABLE_COIN_LABELS: Record<string, string> = {
  usdc: "USD Coin",
  usdt: "Tether",
  cusd: "Celo Dollar",
  dai: "Dai",
};

// ─────────────────────────────────────────────
// Circle configuration limits
// ─────────────────────────────────────────────

export const CIRCLE_CONFIG = {
  MIN_MEMBERS: 2,
  MAX_MEMBERS: 50,
  MIN_CONTRIBUTION_AMOUNT: 100,   // in local currency minor units
  MAX_CONTRIBUTION_AMOUNT: 1_000_000,
  INVITE_CODE_LENGTH: 8,
  FREQUENCIES: ["daily", "weekly", "biweekly", "monthly"] as const,
  PAYOUT_ORDERS: ["fixed", "random", "vote"] as const,
} as const;

// ─────────────────────────────────────────────
// Pagination defaults
// ─────────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// ─────────────────────────────────────────────
// Payment gateways
// ─────────────────────────────────────────────

export const PAYMENT_GATEWAYS = [
  "paystack",
  "flutterwave",
  "cashramp",
  "on_chain_cashramp",
  "on_chain_solana",
  "coopwise_network",
  "cash",
] as const;

export const WEB2_GATEWAYS = ["paystack", "flutterwave", "cashramp"] as const;
export const WEB3_GATEWAYS = ["on_chain_cashramp", "on_chain_solana"] as const;

// ─────────────────────────────────────────────
// Blockchain
// ─────────────────────────────────────────────

export const BLOCKCHAIN = {
  SUPPORTED_CHAINS: ["solana", "base", "celo", "flow"] as const,
  DEFAULT_STABLE_COIN: "usdc",
  SOLANA_COMMITMENT: "confirmed",
} as const;

// ─────────────────────────────────────────────
// API route prefixes (kept in sync with backend router prefixes)
// ─────────────────────────────────────────────

export const API_ROUTES = {
  AUTH: "/v1/auth",
  USERS: "/v1/users",
  CIRCLES: "/v1/circles",
  CONTRIBUTIONS: "/v1/contributions",
  MEMBERSHIPS: "/v1/memberships",
  WALLETS: "/v1/wallets",
  PAYMENTS: "/v1/payments",
  NOTIFICATIONS: "/v1/notifications",
  INSIGHTS: "/v1/insights",
  DASHBOARD: "/v1/dashboard",
  ANALYTICS: "/v1/analytics",
  SUPPORT: "/v1/support",
  AI_CHAT: "/v1/ai-chat",
} as const;

// ─────────────────────────────────────────────
// Feature flags
// ─────────────────────────────────────────────

export const FEATURES = {
  WEB3_PAYMENTS: false,       // flip when on-chain payments go live
  AI_CHAT: true,
  AI_INSIGHTS: true,
  LEADERBOARD: true,
  MOBILE_APP: false,
} as const;