// src/lib/types.ts

export enum InsightCategory {
  ENERGY = 'ENERGY',
  FINANCIAL = 'FINANCIAL',
  PRODUCTIVITY = 'PRODUCTIVITY',
  ANALYTICS = 'ANALYTICS',
  GOAL_SETTING = 'GOAL_SETTING',
  CALCULATION = 'CALCULATION',
  STRATEGY = 'STRATEGY',
  INNOVATION = 'INNOVATION'
}

export enum InsightDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}
export enum ImplementationStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DISMISSED = 'DISMISSED'
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export interface InsightMetadata {
  successRate?: number;
  usersImplemented?: number;
  averageTimeToComplete?: string;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  category: InsightCategory;
  status: ImplementationStatus;
  potentialSavings?: number; // Optional field for potential savings
  difficulty: DifficultyLevel;
  estimatedSavings: number;
  timeframe: string;
  implementationTime: string;
  createdAt: string;
  metadata?: InsightMetadata;
  tags?: string[];  
  group?: {
    id: string;
    name: string;
    description?: string;
    totalMembers?: number;
    membersCount: number;
  };
}









export interface DashboardResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    phone: string | null;
    kycStatus: string;
    walletBalance: number;
  };
  summary: {
    yourSavings: number;
    nextContribution: string | null;
    nextPayout: string | null;
    payoutNumber: number | null;
  };
  targets: {
    savingsTarget: number;
    groupGoals: {
      groupId: string;
      groupName: string;
      goalAmount: number;
      savedSoFar: number;
    }[];
  };
  groups: {
    id: string;
    name: string;
    memberCount: number;
    role: "member" | "admin";
    status: "active" | "pending" | "exited";
  }[];
  activities: {
    type: "contribution" | "payout" | "join" | "create";
    timestamp: string;
    description: string;
    amount: number | null;
  }[];
  aiInsights: {
    id: string;
    title: string;
    summary: string;
    category: string;
    impact: "Low" | "Medium" | "High";
    potentialGain: number;
    status: "active" | "ready" | "expired";
  }[];
  notifications: {
    id: string;
    message: string;
    read: boolean;
    timestamp: string;
  }[];
  cooperativeMembers: {
    id: string;
    name: string;
    email: string;
    role: "member" | "admin";
    groupId: string;
  }[];
}
