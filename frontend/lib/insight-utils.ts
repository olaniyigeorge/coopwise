import React from 'react'
import {
  AIInsight,
  InsightCategory,
  InsightType,
  DifficultyLevel,
  ImplementationStatus,
  InsightSummary
} from './types'

export function formatCurrency(amount: number, currency: string = '₦'): string {
  return `${currency}${amount.toLocaleString()}`
}

export function formatDate(date: string): string {
  const d = new Date(date)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - d.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else if (diffDays < 30) {
    return `${Math.ceil(diffDays / 7)} weeks ago`
  } else {
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    })
  }
}

export function getDifficultyColor(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case DifficultyLevel.EASY:
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case DifficultyLevel.MEDIUM:
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case DifficultyLevel.HARD:
      return 'bg-rose-100 text-rose-800 border-rose-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export function getDifficultyLabel(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case DifficultyLevel.EASY:
      return 'Easy'
    case DifficultyLevel.MEDIUM:
      return 'Medium'
    case DifficultyLevel.HARD:
      return 'Hard'
    default:
      return 'Unknown'
  }
}

export function getStatusColor(status: ImplementationStatus): string {
  switch (status) {
    case ImplementationStatus.COMPLETED:
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case ImplementationStatus.IN_PROGRESS:
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case ImplementationStatus.NOT_STARTED:
      return 'bg-slate-100 text-slate-700 border-slate-200'
    case ImplementationStatus.DISMISSED:
      return 'bg-red-100 text-red-700 border-red-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export function getStatusLabel(status: ImplementationStatus): string {
  switch (status) {
    case ImplementationStatus.COMPLETED:
      return 'Completed'
    case ImplementationStatus.IN_PROGRESS:
      return 'In Progress'
    case ImplementationStatus.NOT_STARTED:
      return 'Not Started'
    case ImplementationStatus.DISMISSED:
      return 'Dismissed'
    default:
      return 'Unknown'
  }
}

export function getCategoryLabel(category: InsightCategory): string {
  switch (category) {
    case InsightCategory.ENERGY_SAVING:
      return 'Energy Saving'
    case InsightCategory.FINANCIAL_OPTIMIZATION:
      return 'Financial Optimization'
    case InsightCategory.CONTRIBUTION_STRATEGY:
      return 'Contribution Strategy'
    case InsightCategory.SPENDING_ANALYSIS:
      return 'Spending Analysis'
    case InsightCategory.INVESTMENT_TIPS:
      return 'Investment Tips'
    case InsightCategory.BUDGETING:
      return 'Budgeting'
    case InsightCategory.GOAL_SETTING:
      return 'Goal Setting'
    default:
      return 'General'
  }
}

export function getCategoryIcon(category: InsightCategory): string {
  switch (category) {
    case InsightCategory.ENERGY_SAVING:
      return 'Zap'
    case InsightCategory.FINANCIAL_OPTIMIZATION:
      return 'DollarSign'
    case InsightCategory.CONTRIBUTION_STRATEGY:
      return 'TrendingUp'
    case InsightCategory.SPENDING_ANALYSIS:
      return 'BarChart3'
    case InsightCategory.INVESTMENT_TIPS:
      return 'Target'
    case InsightCategory.BUDGETING:
      return 'Calculator'
    case InsightCategory.GOAL_SETTING:
      return 'Flag'
    default:
      return 'Lightbulb'
  }
}

export function getTypeLabel(type: InsightType): string {
  switch (type) {
    case InsightType.PERSONAL:
      return 'Personal'
    case InsightType.GROUP_SPECIFIC:
      return 'Group Specific'
    case InsightType.GENERAL:
      return 'General'
    case InsightType.TRENDING:
      return 'Trending'
    default:
      return 'General'
  }
}

export function calculateInsightSummary(insights: AIInsight[]): InsightSummary {
  const summary: InsightSummary = {
    totalInsights: insights.length,
    completedInsights: 0,
    inProgressInsights: 0,
    notStartedInsights: 0,
    totalPotentialSavings: 0,
    actualSavingsAchieved: 0,
    averageDifficulty: 'Easy'
  }

  let difficultySum = 0
  let completedSavings = 0

  insights.forEach(insight => {
    summary.totalPotentialSavings += insight.estimatedSavings

    switch (insight.status) {
      case ImplementationStatus.COMPLETED:
        summary.completedInsights++
        completedSavings += insight.estimatedSavings
        break
      case ImplementationStatus.IN_PROGRESS:
        summary.inProgressInsights++
        break
      case ImplementationStatus.NOT_STARTED:
        summary.notStartedInsights++
        break
    }

    // Calculate difficulty weight (Easy=1, Medium=2, Hard=3)
    switch (insight.difficulty) {
      case DifficultyLevel.EASY:
        difficultySum += 1
        break
      case DifficultyLevel.MEDIUM:
        difficultySum += 2
        break
      case DifficultyLevel.HARD:
        difficultySum += 3
        break
    }
  })

  summary.actualSavingsAchieved = completedSavings

  // Calculate average difficulty
  if (insights.length > 0) {
    const avgDifficulty = difficultySum / insights.length
    if (avgDifficulty <= 1.5) {
      summary.averageDifficulty = 'Easy'
    } else if (avgDifficulty <= 2.5) {
      summary.averageDifficulty = 'Medium'
    } else {
      summary.averageDifficulty = 'Hard'
    }
  }

  return summary
}

export function sortInsightsByRelevance(insights: AIInsight[]): AIInsight[] {
  return [...insights].sort((a, b) => {
    // Prioritize by status first (not started > in progress > completed)
    const statusPriority = {
      [ImplementationStatus.NOT_STARTED]: 3,
      [ImplementationStatus.IN_PROGRESS]: 2,
      [ImplementationStatus.COMPLETED]: 1,
      [ImplementationStatus.DISMISSED]: 0
    }

    if (statusPriority[a.status] !== statusPriority[b.status]) {
      return statusPriority[b.status] - statusPriority[a.status]
    }

    // Then by estimated savings (higher first)
    if (a.estimatedSavings !== b.estimatedSavings) {
      return b.estimatedSavings - a.estimatedSavings
    }

    // Finally by difficulty (easier first)
    const difficultyPriority = {
      [DifficultyLevel.EASY]: 3,
      [DifficultyLevel.MEDIUM]: 2,
      [DifficultyLevel.HARD]: 1
    }

    return difficultyPriority[b.difficulty] - difficultyPriority[a.difficulty]
  })
}

export function filterInsights(
  insights: AIInsight[], 
  filters: {
    category?: InsightCategory[]
    type?: InsightType[]
    difficulty?: DifficultyLevel[]
    status?: ImplementationStatus[]
    groupId?: string
    minSavings?: number
    maxSavings?: number
    searchQuery?: string
  }
): AIInsight[] {
  return insights.filter(insight => {
    if (filters.category && !filters.category.includes(insight.category)) {
      return false
    }
    
    if (filters.type && !filters.type.includes(insight.type)) {
      return false
    }
    
    if (filters.difficulty && !filters.difficulty.includes(insight.difficulty)) {
      return false
    }
    
    if (filters.status && !filters.status.includes(insight.status)) {
      return false
    }
    
    if (filters.groupId && insight.groupId !== filters.groupId) {
      return false
    }
    
    if (filters.minSavings && insight.estimatedSavings < filters.minSavings) {
      return false
    }
    
    if (filters.maxSavings && insight.estimatedSavings > filters.maxSavings) {
      return false
    }

    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase()
      return (
        insight.title.toLowerCase().includes(searchLower) ||
        insight.description.toLowerCase().includes(searchLower) ||
        insight.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }
    
    return true
  })
}

export function getInsightsByCategory(insights: AIInsight[], category: InsightCategory): AIInsight[] {
  return insights.filter(insight => insight.category === category)
}

export function getPersonalInsights(insights: AIInsight[], userId: string): AIInsight[] {
  return insights.filter(insight => 
    insight.type === InsightType.PERSONAL || 
    insight.type === InsightType.GENERAL
  )
}

export function getGroupInsights(insights: AIInsight[], groupId: string): AIInsight[] {
  return insights.filter(insight => insight.groupId === groupId)
}

export function getTrendingInsights(insights: AIInsight[]): AIInsight[] {
  return insights
    .filter(insight => insight.type === InsightType.TRENDING)
    .sort((a, b) => (b.metadata?.usersImplemented || 0) - (a.metadata?.usersImplemented || 0))
} 