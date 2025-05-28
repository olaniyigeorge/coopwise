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
  difficulty: InsightDifficulty;
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
