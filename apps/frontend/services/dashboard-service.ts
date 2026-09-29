import { UUID } from 'crypto';
import ApiService from './api-service';




const BASE = "/dashboard"

export async function getDashboardData(): Promise<DashboardData> {
  try {
    return await ApiService.get<DashboardData>(BASE, {
      headers: {
        "Cache-Control": "no-cache, no-store",
      },
    })
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error)
    return defDashData
  }
}








// ----------- API Consistent Interfaces ----------

type Decimal = number; 


// Enums 
export enum UserRoles {
  // Add your frequency options here, example:
  ADMIN = "admin",
  USER = "user"
}

export enum LocalCurrency {
  NGN = "NGN",
  GHS = "GHS",
  KES = "KES",

}

export enum ContributionFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
}

export enum PayoutStrategy {
  ROTATING = "rotating",
  EQUAL = "equal",
  PRIORITY = "priority",
}

export enum CooperativeModel {
  AJO = "ajo",
  COOP = "coop"

}

export enum CooperativeStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  COMPLETED = "completed"

}

export enum ActivityType {
  JOINED_GROUP = "joined_group",
  LEFT_GROUP = "left_group",
  MADE_CONTRIBUTION = "made_contribution",
  RECEIVED_PAYOUT = "received_payout",
  DECLINED_INVITE = "declined_invite",
  ACCEPTED_INVITE = "accepted_invite",
  CREATED_GROUP = "created_group",
}


export enum InsightCategory {
  CONTRIBUTION = "contribution",
  SAVINGS = "savings",
  BEHAVIOR = "behavior",
  GROUP = "group",
  MILESTONE = "milestone",
  ENERGY_SAVING = "energy_saving",
  FINANCIAL_OPTIMIZATION = "financial_optimization",
  CONTRIBUTION_STRATEGY = "contribution_strategy",
  SPENDING_ANALYSIS = "spending_analysis",
  INVESTMENT_TIPS = "investment_tips",
  BUDGETING = "budgeting",
  GOAL_SETTING = "goal_setting",
  OTHER = "other"
}

export enum InsightType {
  PERSONAL = "personal",
  GROUP_SPECIFIC = "group_specific",
  GENERAL = "general",
  TRENDING = "trending",
}

export enum DifficultyLevel {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard"
}    

export enum ImplementationStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  DISMISSED = "dismissed",
}

export enum EventType {
  GROUP = "group",
  TRANSACTION = "transaction",
  MEMBERSHIP = "membership",
  CONTRIBUTION = "contribution",
  PAYOUT = "payout",
  GENERAL_ALERT = "general_alert",
  SYSTEM = "system",
  AI_INSIGHT = "ai_insight",
  OTHER = "other"

}

export enum NotificationType {
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  DANGER = "danger",

}

export enum NotificationStatus {
  UNREAD = "unread",
  READ = "read",
  ARCHIVED = "archived"

}

export enum MembershipRole {
    ADMIN = "admin",
    MEMBER = "member"
}

// export enum MembershipStatus {
//   CLICKED = "clicked",
//   ACCEPTED = "accepted",
//   PENDING = "pending",
//   REJECTED = "rejected",
//   CANCELLED = "cancelled"
// }
export enum MembershipStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  LEFT = "left",
  REMOVED = "removed",
  PENDING = "pending",
}


export enum IncomeRange {
  below_50k = "Below 50K",
  range_50k_100k = "50K - 100K",
  range_100k_200k = "100K - 200K",
  range_200k_350k = "200K - 350K",
  range_350k_500k = "350K - 500K",
  above_500k = "500K and above"
}

export enum SavingFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly"
}


export interface InsightMetadata {
  success_rate?: number;               
  users_implemented?: number;          
  average_time_to_complete?: number;   
  prerequisites?: string[];            
  related_insights?: string[];         
  source?: string;                     
  confidence_score?: number | null;
}

// User Detail
export interface UserDetail {
  id: UUID;
  username: string;
  email: string;
  full_name: string;
  phone_number: string;
  role: UserRoles;
  target_savings_amount?: number;
  savings_purpose?: string;
  income_range?: IncomeRange;
  saving_frequency?: SavingFrequency;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  is_kyc_verified?: boolean;
  created_at: string; // ISO datetime string
  updated_at: string;
}

// Wallet Detail
export interface WalletDetail {
  id: UUID;
  user_id: UUID;
  stable_coin_balance: Decimal;
  /** Balance in the wallet's own currency (server-converted). Arrives as a decimal string. */
  local_balance: Decimal;
  local_currency: LocalCurrency;
  created_at: string;
  updated_at: string;
}


export interface Summary {
  your_savings: number
  next_contribution?: string | null;
  next_payout?: string | null;
  wallet?: WalletDetail;
}

export interface CoopGroupTargetSummary {
  id: UUID;
  name: string;
  contribution_amount: number;
  target_amount: number;
}

export interface Targets {
  savings_target: number;
  group_goals: CoopGroupTargetSummary[];
}


// Coop Group Details
// Matches the real CooperativeRead wire shape (id/name/description/
// cover_image/status/coop_model/created_by/timestamps) — no
// contribution/target/member-count fields, those live on the separate
// FinancialRule/MembershipRule sub-resources, not flat on the cooperative.
export interface CoopGroupDetails {
  id: UUID;
  name: string;
  created_by: UUID;
  description?: string | null;
  cover_image?: string | null;
  coop_model: CooperativeModel;
  status: CooperativeStatus;
  created_at: string;
  updated_at: string;
}

// Explore Groups
export interface ExploreGroups {
  user_groups: CoopGroupDetails[];
  suggested_groups: CoopGroupDetails[];
}

// Activity Detail
export interface ActivityDetail {
  id: UUID;
  user_id: UUID;
  group_id?: UUID | null;
  type: ActivityType;
  description: string;
  entity_id?: string | null;
  amount?: number | null;
  created_at: string;
}

// AI Insight Base
export interface AIInsightBase {
  title: string;
  description?: string | null;
  summary: string;
  recommended_action?: string | null;
  category: InsightCategory;
  type: InsightType;
  difficulty: DifficultyLevel;
  status: ImplementationStatus;
  estimated_savings: number;
  potential_gain: number;
  impact_score: number;
  tags: string[];
  timeframe?: string | null;
  implementation_time: number;
  insight_metadata?: InsightMetadata | null;
}

// AI Insight Detail
export interface AIInsightDetail extends AIInsightBase {
  id: UUID;
  user_id?: UUID | null;
  group_id?: UUID | null;
  created_at: string;
  updated_at: string;
}

// Notification Detail
export interface NotificationDetail {
  id: UUID;
  title?: string | null;
  message?: string | null;
  event_type: EventType;
  type: NotificationType;
  status: NotificationStatus;
  is_read: boolean;
  read_at?: string | null;
  user: UserDetail;
  entity_url?: string | null;
  created_at: string;
}



// Membership Details
// Matches the real GroupMembership row (memberships/schemas.py's
// MembershipDetails) — id is a UUID, not int, and there's no invited_by
// column (that lives only on the separate CoopInvitation model, not
// wired up yet). status is a plain string: the column mixes
// MembershipStatus values ("active", from cooperative auto-enrollment)
// and invite-lifecycle values ("clicked"/"pending"/"accepted"/...).
export interface MembershipDetails {
  id: UUID;
  user_id?: UUID | null; // null means still invite
  group_id: UUID;
  role: MembershipRole;
  status: string;
  joined_at?: string | null;
  created_at: string;
  updated_at: string;
}




export interface DashboardData {
  user: UserDetail;
  summary: Summary;
  targets: Targets;
  groups: ExploreGroups;
  activities: ActivityDetail[];
  ai_insights: AIInsightDetail[];
  notifications: NotificationDetail[];
  cooperative_members: MembershipDetails[];
}


export const defDashData: DashboardData = {
  user: {
    id: "00000000-0000-0000-0000-000000000000",
    username: "user@example.com",
    email: "user@example.com",
    full_name: "John Doe",
    phone_number: "+10000000000",
    role: UserRoles.USER,
    target_savings_amount: 0,
    savings_purpose: "",
    income_range: IncomeRange.below_50k,
    saving_frequency: SavingFrequency.DAILY,
    is_email_verified: false,
    is_phone_verified: false,
    created_at: "2025-06-07T13:00:38.311147",
    updated_at: "2025-06-07T13:02:26.133341"
  },
  summary: {
    your_savings: 0,
    next_contribution: null,
    next_payout: null,
    wallet: {
      id: "11111111-1111-1111-1111-111111111111",
      user_id: "00000000-0000-0000-0000-000000000000",
      stable_coin_balance: 0,
      local_balance: 0,
      local_currency: LocalCurrency.NGN,
      created_at: "2025-06-07T13:01:49.344291",
      updated_at: "2025-06-07T15:48:05.178271"
    }
  },
  targets: {
    savings_target: 0,
    group_goals: [
      {
        id: "22222222-2222-2222-2222-222222222222",
        name: "Community Savings Fund",
        contribution_amount: 15000,
        target_amount: 180000
      }
    ]
  },
  groups: {
    // Empty rather than fabricated — this is also the initial state shown
    // before the real fetch resolves, so a fake cooperative here would
    // flash on every page load, not just on a genuine fetch failure.
    user_groups: [],
    suggested_groups: []
  },
  activities: [
    // Mock fallback intentionally empty so "Recent Activity" doesn't show fake data.
  ],
  ai_insights: [
    {
      id: "44444444-4444-4444-4444-444444444444",
      user_id: "00000000-0000-0000-0000-000000000000",
      group_id: null,
      title: "Start Small, Save Daily: Even Small Amounts Add Up!",
      description: "Since you prefer saving daily and your income is in the below 50k range, even saving a small amount like ₦100-₦200 each day can make a big difference. Consistent saving, no matter how small, helps build a saving habit and accumulates substantial funds over time.",
      summary: "Given your daily saving frequency and income range, consistently saving small amounts daily can help you build a significant sum over time.",
      recommended_action: "Set a daily savings goal of ₦100-₦200 and automate the transfer to your savings account each day.",
      category: InsightCategory.GOAL_SETTING,      
      type: InsightType.GENERAL,           
      difficulty: DifficultyLevel.MEDIUM,     
      status: ImplementationStatus.IN_PROGRESS,        
      estimated_savings: 7000,
      potential_gain: 0,
      impact_score: 8,
      tags: [
        "daily savings",
        "small amounts",
        "consistency"
      ],
      timeframe: "1 month",
      implementation_time: 0.5,
      insight_metadata: {
        success_rate: 0.85,
        users_implemented: 310,
        average_time_to_complete: 0.25,
        prerequisites: [
          "an account",
          "a linked bank account"
        ],
        related_insights: [],
        source: "AI Engine",
        confidence_score: 0.88
      },
      created_at: "2025-06-07T15:58:39.180306",
      updated_at: "2025-06-07T15:58:39.180310"
    }
  ],
  notifications: [],
  cooperative_members: [
    {
      id: "00000000-0000-0000-0000-000000000001",
      user_id: "00000000-0000-0000-0000-000000000000",
      group_id: "22222222-2222-2222-2222-222222222222",
      role: MembershipRole.ADMIN,
      status: MembershipStatus.ACTIVE,
      joined_at: null,
      created_at: "2025-06-07T16:00:25.189824",
      updated_at: "2025-06-07T16:00:25.189828"
    }
  ]
};
