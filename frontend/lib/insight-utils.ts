
import { DifficultyLevel, ImplementationStatus, InsightCategory, InsightDifficulty } from './types'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function getDifficultyColor(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'hard':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getDifficultyLabel(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 'easy':
      return 'Easy'
    case 'medium':
      return 'Medium'
    case 'hard':
      return 'Hard'
    default:
      return 'Unknown'
  }
}

export function getStatusColor(status: ImplementationStatus): string {
  switch (status) {
    case ImplementationStatus.NOT_STARTED:
      return 'bg-gray-100 text-gray-800'
    case ImplementationStatus.IN_PROGRESS:
      return 'bg-yellow-100 text-yellow-800'
    case ImplementationStatus.COMPLETED:
      return 'bg-green-100 text-green-800'
    case ImplementationStatus.DISMISSED:
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getStatusLabel(status: ImplementationStatus): string {
  switch (status) {
    case ImplementationStatus.NOT_STARTED:
      return 'Not Started'
    case ImplementationStatus.IN_PROGRESS:
      return 'In Progress'
    case ImplementationStatus.COMPLETED:
      return 'Completed'
    case ImplementationStatus.DISMISSED:
      return 'Dismissed'
    default:
      return 'Unknown'
  }
}





import { AIInsight } from './types'

interface InsightSummary {
  totalInsights: number
  totalPotentialSavings: number
  completedInsights: number
}

export function calculateInsightSummary(insights: AIInsight[]): InsightSummary {
  const totalInsights = insights.length
  const totalPotentialSavings = insights.reduce((sum, i) => sum + (i.potentialSavings ?? 0), 0)
  const completedInsights = insights.filter(i => i.status === ImplementationStatus.COMPLETED).length

  return {
    totalInsights,
    totalPotentialSavings,
    completedInsights
  }
}

interface InsightFilterOptions {
  searchQuery?: string
}

export function filterInsights(insights: AIInsight[], options: InsightFilterOptions): AIInsight[] {
  let result = [...insights]

  if (options.searchQuery) {
    const query = options.searchQuery.toLowerCase()
    result = result.filter(
      i => i.title.toLowerCase().includes(query) ||
           i.description.toLowerCase().includes(query) ||
           i.category.toLowerCase().includes(query)
    )
  }

  return result
}




export function getCategoryLabel(category: InsightCategory): string {
  switch (category) {
    case InsightCategory.ENERGY:
      return 'Energy'
    case InsightCategory.FINANCIAL:
      return 'Financial'
    case InsightCategory.PRODUCTIVITY:
      return 'Productivity'
    case InsightCategory.ANALYTICS:
      return 'Analytics and Reporting'
    case InsightCategory.GOAL_SETTING:
      return 'Goal Setting'
    case InsightCategory.CALCULATION:
      return 'Calculation'
    case InsightCategory.STRATEGY:
      return 'Strategy'
    case InsightCategory.INNOVATION:
      return 'Innovation'
    default:
      return 'Other'
  }
}


// This returns the **string name** of the icon component as expected in your page code
export function getCategoryIcon(category: InsightCategory): string {
  switch (category) {
    case InsightCategory.ENERGY:
      return 'Zap'
    case InsightCategory.FINANCIAL:
      return 'DollarSign'
    case InsightCategory.PRODUCTIVITY:
      return 'TrendingUp'
    case InsightCategory.ANALYTICS:
      return 'BarChart3'
    case InsightCategory.GOAL_SETTING:
      return 'Target'
    case InsightCategory.CALCULATION:
      return 'Calculator'
    case InsightCategory.STRATEGY:
      return 'Flag'
    case InsightCategory.INNOVATION:
      return 'Lightbulb'
    default:
      return 'Lightbulb'
  }
}
