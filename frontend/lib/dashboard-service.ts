import { UUID } from 'crypto';
import AuthService from './auth-service';
import Dashboard from '@/app/dashboard/page';

// export interface DashboardData {
//   savings: {
//     total: number;
//     goal: number;
//     progress: number;
//   };
//   wallet: {
//     balance: number;
//   };
//   nextContribution: {
//     groupName?: string;
//     amount?: number;
//     dueDate?: string;
//     hasUpcoming: boolean;
//   };
//   nextPayout: {
//     groupName?: string;
//     amount?: number;
//     dueDate?: string;
//     hasUpcoming: boolean;
//   };
//   recentActivity: {
//     id: string;
//     type: string;
//     description: string;
//     date: string;
//     amount?: number;
//     status?: string;
//   }[];
//   savingsGoal: {
//     name: string;
//     current: number;
//     target: number;
//     progress: number;
//     remaining: number;
//   };
//   aiInsights: {
//     available: boolean;
//     insights?: {
//       title: string;
//       description: string;
//     }[];
//   };
// }



export async function getDashboardData(): Promise<DashboardData> {
  try {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Fetching dashboard data...');
    const response = await fetch('/api/v1/dashboard/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Dashboard API error response:', errorData);
      throw new Error(`Error fetching dashboard data: ${response.status}`);
    }

    const data = await response.json();
    console.log('Dashboard data from API:', data);
    
    return data;
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    // Return default/empty data structure in case of error
    // return {
    //   savings: {
    //     total: 0,
    //     goal: 0,
    //     progress: 0,
    //   },
    //   wallet: {
    //     balance: 0,
    //   },
    //   nextContribution: {
    //     hasUpcoming: false,
    //   },
    //   nextPayout: {
    //     hasUpcoming: false,
    //   },
    //   recentActivity: [],
    //   savingsGoal: {
    //     name: '',
    //     current: 0,
    //     target: 0,
    //     progress: 0,
    //     remaining: 0,
    //   },
    //   aiInsights: {
    //     available: false,
    //     insights: [],
    //   },
    // };
    const defDashData: DashboardData = {
      user: {
        id: "00000000-0000-0000-0000-000000000000",
        username: "user@example.com",
        email: "user@example.com",
        fullName: "John Doe",
        phoneNumber: "+10000000000",
        role: UserRoles.USER,
        targetSavingsAmount: 0,
        savingsPurpose: "",
        incomeRange: IncomeRange.BELOW_50K,
        savingFrequency: SavingFrequency.DAILY,
        isEmailVerified: false,
        isPhoneVerified: false,
        createdAt: "2025-06-07T13:00:38.311147",
        updatedAt: "2025-06-07T13:02:26.133341"
      },
      summary: {
        yourSavings: 0,
        nextContribution: null,
        nextPayout: null,
        wallet: {
          id: "11111111-1111-1111-1111-111111111111",
          userId: "00000000-0000-0000-0000-000000000000",
          stableCoinBalance: 6.25,
          localCurrency: LocalCurrency.NGN,
          createdAt: "2025-06-07T13:01:49.344291",
          updatedAt: "2025-06-07T15:48:05.178271"
        }
      },
      targets: {
        savingsTarget: 0,
        groupGoals: [
          {
            id: "22222222-2222-2222-2222-222222222222",
            name: "Community Savings Fund",
            contributionAmount: 15000,
            targetAmount: 180000,
          }
        ]
      },
      groups: {
        userGroups: [
          {
            id: "22222222-2222-2222-2222-222222222222",
            name: "Community Savings Fund",
            creatorId: "00000000-0000-0000-0000-000000000000",
            description: null,
            contributionAmount: 15000,
            contributionFrequency: ContributionFrequency.WEEKLY,
            payoutStrategy: PayoutStrategy.ROTATING,
            coopModel: CooperativeModel.AJO,
            maxMembers: 12,
            targetAmount: 180000,
            status: CooperativeStatus.ACTIVE,
            rules: [
              {
                title: "Contribution Rule",
                description: "Members must contribute ₦15,000 every week without fail."
              },
              {
                title: "Membership Cap",
                description: "Group is limited to 12 active members to maintain accountability."
              },
              {
                title: "Payout Decision",
                description: "Payout will be made when target is reached and members vote on purchase or split."
              },
              {
                title: "Transparency",
                description: "All wallet balances and transactions are visible to members in real-time."
              },
              {
                title: "AI Nudges",
                description: "AI will send reminders and savings insights based on your habits."
              }
            ],
            createdAt: "2025-06-07T16:00:25.176801",
            updatedAt: "2025-06-07T16:00:25.176805"
          }
        ],
        suggestedGroups: []
      },
      activities: [
        {
          id: "33333333-3333-3333-3333-333333333333",
          userId: "00000000-0000-0000-0000-000000000000",
          groupId: "22222222-2222-2222-2222-222222222222",
          type: ActivityType.CREATED_GROUP,
          description: "You created a group",
          entityId: "22222222-2222-2222-2222-222222222222",
          amount: null,
          createdAt: "2025-06-07T16:00:25.196647"
        }
      ],
      aiInsights: [
        {
          id: "44444444-4444-4444-4444-444444444444",
          userId: "00000000-0000-0000-0000-000000000000",
          groupId: null,
          title: "Start Small, Save Daily: Even Small Amounts Add Up!",
          description: "Since you prefer saving daily and your income is in the below 50k range, even saving a small amount like ₦100-₦200 each day can make a big difference. Consistent saving, no matter how small, helps build a saving habit and accumulates substantial funds over time.",
          summary: "Given your daily saving frequency and income range, consistently saving small amounts daily can help you build a significant sum over time.",
          recommendedAction: "Set a daily savings goal of ₦100-₦200 and automate the transfer to your savings account each day.",
          category: InsightCategory.GOAL_SETTING,      
          type: InsightType.GENERAL,           
          difficulty: DifficultyLevel.MEDIUM,     
          status: ImplementationStatus.IN_PROGRESS,        
          estimatedSavings: 7000,
          potentialGain: 0,
          impactScore: 8,
          tags: [
            "daily savings",
            "small amounts",
            "consistency"
          ],
          timeframe: "1 month",
          implementationTime: 0.5,
          insightMetadata: {
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
          createdAt: "2025-06-07T15:58:39.180306",
          updatedAt: "2025-06-07T15:58:39.180310"
        }
      ],
      notifications: [
        {
          id: "55555555-5555-5555-5555-555555555555",
          title: "New Cooperative Created",
          message: "Your cooperative, Community Savings Fund was created successfully",
          eventType: EventType.GROUP, // Add appropriate EventType enum value
          type: NotificationType.SUCCESS,
          status: NotificationStatus.UNREAD,
          isRead: false,
          readAt: null,
          user: {
            id: "00000000-0000-0000-0000-000000000000",
            username: "user@example.com",
            email: "user@example.com",
            fullName: "John Doe",
            phoneNumber: "+10000000000",
            role: UserRoles.USER,
            targetSavingsAmount: 0,
            savingsPurpose: "",
            incomeRange: IncomeRange.BELOW_50K,
            savingFrequency: SavingFrequency.DAILY,
            isEmailVerified: false,
            isPhoneVerified: false,
            createdAt: "2025-06-07T13:00:38.311147",
            updatedAt: "2025-06-07T13:02:26.133341"
          },
          entityUrl: null,
          createdAt: "2025-06-07T16:00:25.208159"
        },
        {
          id: "66666666-6666-6666-6666-666666666666",
          title: "Sign up Successful",
          message: "Welcome to Coopwise",
          eventType: EventType.GENERAL_ALERT, // Add appropriate EventType enum value
          type: NotificationType.INFO,
          status: NotificationStatus.UNREAD,
          isRead: false,
          readAt: null,
          user: {
            id: "00000000-0000-0000-0000-000000000000",
            username: "user@example.com",
            email: "user@example.com",
            fullName: "John Doe",
            phoneNumber: "+10000000000",
            role: UserRoles.USER,
            targetSavingsAmount: 0,
            savingsPurpose: "",
            incomeRange: IncomeRange.BELOW_50K,
            savingFrequency: SavingFrequency.DAILY,
            isEmailVerified: false,
            isPhoneVerified: false,
            createdAt: "2025-06-07T13:00:38.311147",
            updatedAt: "2025-06-07T13:02:26.133341"
          },
          entityUrl: null,
          createdAt: "2025-06-07T13:00:38.422020"
        }
      ],
      cooperativeMembers: [
        {
          id: 1,
          userId: "00000000-0000-0000-0000-000000000000",
          groupId: "22222222-2222-2222-2222-222222222222",
          role: MembershipRole.ADMIN,
          invitedBy: "00000000-0000-0000-0000-000000000000",
          status: MembershipStatus.ACCEPTED,
          joinedAt: null,
          createdAt: "2025-06-07T16:00:25.189824",
          updatedAt: "2025-06-07T16:00:25.189828"
        }
      ]
    };
    
    
    return defDashData;
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
  CONTRIBUTION = "contribution",
  PAYOUT = "payout",
  JOINED_GROUP = "joined_group",
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

export enum MembershipStatus {
  CLICKED = "clicked",
  ACCEPTED = "accepted",
  PENDING = "pending",
  REJECTED = "rejected",
  CANCELLED = "cancelled"
}


export enum IncomeRange {
  BELOW_50K = "Below 50K",
  RANGE_50K_100K = "50K - 100K",
  RANGE_100K_200K = "100K - 200K",
  RANGE_200K_350K = "200K - 350K",
  RANGE_350K_500K = "350K - 500K",
  ABOVE_500K = "500K and above"
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
  fullName: string;
  phoneNumber: string;
  role: UserRoles;
  targetSavingsAmount?: number;
  savingsPurpose?: string;
  incomeRange?: IncomeRange;
  savingFrequency?: SavingFrequency;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string; // ISO datetime string
  updatedAt: string;
}

// Wallet Detail
export interface WalletDetail {
  id: UUID;
  userId: UUID;
  stableCoinBalance: Decimal;
  localCurrency: LocalCurrency;
  createdAt: string;
  updatedAt: string;
}


export interface Summary {
  yourSavings: number
  nextContribution?: string | null;
  nextPayout?: string | null;
  wallet?: WalletDetail;
}

export interface CoopGroupTargetSummary {
  id: UUID;
  name: string;
  contributionAmount: number;
  targetAmount: number;
}

export interface Targets {
  savingsTarget: number;
  groupGoals: CoopGroupTargetSummary[];
}


// Coop Group Details
export interface CoopGroupDetails {
  id: UUID;
  name: string;
  creatorId: UUID;
  description?: string | null;
  contributionAmount: number;
  contributionFrequency: ContributionFrequency;
  payoutStrategy: PayoutStrategy;
  coopModel: CooperativeModel;
  maxMembers: number;
  targetAmount: number;
  status: CooperativeStatus;
  rules?: Array<Record<string, any>> | null; // rules are list of dicts, so object[]
  createdAt: string;
  updatedAt: string;
}

// Explore Groups
export interface ExploreGroups {
  userGroups: CoopGroupDetails[];
  suggestedGroups: CoopGroupDetails[];
}

// Activity Detail
export interface ActivityDetail {
  id: UUID;
  userId: UUID;
  groupId?: UUID | null;
  type: ActivityType;
  description: string;
  entityId?: string | null;
  amount?: number | null;
  createdAt: string;
}

// AI Insight Base
export interface AIInsightBase {
  title: string;
  description?: string | null;
  summary: string;
  recommendedAction?: string | null;
  category: InsightCategory;
  type: InsightType;
  difficulty: DifficultyLevel;
  status: ImplementationStatus;
  estimatedSavings: number;
  potentialGain: number;
  impactScore: number;
  tags: string[];
  timeframe?: string | null;
  implementationTime: number;
  insightMetadata?: InsightMetadata | null;
}

// AI Insight Detail
export interface AIInsightDetail extends AIInsightBase {
  id: UUID;
  userId?: UUID | null;
  groupId?: UUID | null;
  createdAt: string;
  updatedAt: string;
}

// Notification Detail
export interface NotificationDetail {
  id: UUID;
  title?: string | null;
  message?: string | null;
  eventType: EventType;
  type: NotificationType;
  status: NotificationStatus;
  isRead: boolean;
  readAt?: string | null;
  user: UserDetail;
  entityUrl?: string | null;
  createdAt: string;
}

// Membership Details
export interface MembershipDetails {
  id: number;
  userId?: UUID | null; // null means still invite
  groupId: UUID;
  role: MembershipRole;
  invitedBy: UUID;
  status: MembershipStatus;
  joinedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}




export interface DashboardData {
  user: UserDetail;
  summary: Summary;
  targets: Targets;
  groups: ExploreGroups;
  activities: ActivityDetail[];
  aiInsights: AIInsightDetail[];
  notifications: NotificationDetail[];
  cooperativeMembers: MembershipDetails[];
}
