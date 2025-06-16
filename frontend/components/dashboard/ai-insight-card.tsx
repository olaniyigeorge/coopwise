import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LightbulbIcon, 
  ArrowRightIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  TrendingUpIcon,
  SparklesIcon
} from 'lucide-react'
import { AIInsight, ImplementationStatus, DifficultyLevel } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { AIInsightDetail } from '@/lib/dashboard-service'

interface AIInsightCardProps {
  insight: AIInsightDetail // AIInsight
  onStart?: (insight: AIInsightDetail) => void
  onComplete?: (insight: AIInsightDetail) => void
  onDismiss?: (insight: AIInsightDetail) => void
  compact?: boolean
}

export default function AIInsightCard({ 
  insight, 
  onStart, 
  onComplete, 
  onDismiss,
  compact = false
}: AIInsightCardProps) {
  const router = useRouter()
  
  // Get status color
  const getStatusColor = () => {
    switch (insight.status) {
      case ImplementationStatus.COMPLETED:
        return 'bg-green-50 border-green-100 hover:border-green-200'
      case ImplementationStatus.IN_PROGRESS:
        return 'bg-blue-50 border-blue-100 hover:border-blue-200'
      case ImplementationStatus.NOT_STARTED:
      default:
        return 'bg-white border-gray-100 hover:border-gray-200'
    }
  }
  
  // Get difficulty label and color
  const getDifficultyData = () => {
    switch (insight.difficulty) {
      case DifficultyLevel.EASY:
        return { label: 'Easy', color: 'bg-green-100 text-green-800' }
      case DifficultyLevel.MEDIUM:
        return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' }
      case DifficultyLevel.HARD:
        return { label: 'Hard', color: 'bg-red-100 text-red-800' }
      default:
        return { label: 'Easy', color: 'bg-green-100 text-green-800' }
    }
  }
  
  const { label: difficultyLabel, color: difficultyColor } = getDifficultyData()
  
  // View insight details
  const handleViewDetails = () => {
    router.push(`/dashboard/ai-insights/${insight.id}`)
  }
  
  return (
    <Card 
      className={`${getStatusColor()} transition-all duration-200 hover:shadow-md border ${compact ? 'p-0' : 'p-1'}`}
    >
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="flex justify-between items-start gap-3 mb-2">
          <div className="flex items-center gap-2">
            {insight.status === ImplementationStatus.COMPLETED ? (
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
            ) : insight.status === ImplementationStatus.IN_PROGRESS ? (
              <ClockIcon className="w-5 h-5 text-blue-500" />
            ) : (
              <LightbulbIcon className="w-5 h-5 text-amber-500" />
            )}
            <Badge className={difficultyColor} variant="secondary">
              {difficultyLabel}
            </Badge>
          </div>
          <div>
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">
              {formatCurrency(insight.estimated_savings)}/{insight.timeframe}
            </Badge>
          </div>
        </div>
        
        <h3 className={`font-medium text-gray-900 ${compact ? 'text-sm mb-1' : 'mb-2'}`}>
          {insight.title}
        </h3>
        
        {!compact && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-4">
            {insight.description}
          </p>
        )}
        
        <div className={`flex ${compact ? 'justify-end' : 'justify-between'} items-center mt-2`}>
          {!compact && insight.status !== ImplementationStatus.COMPLETED && (
            <div className="flex gap-2">
              {insight.status === ImplementationStatus.NOT_STARTED && onStart && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={() => onStart(insight)}
                >
                  Start
                </Button>
              )}
              {insight.status === ImplementationStatus.IN_PROGRESS && onComplete && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => onComplete(insight)}
                >
                  Complete
                </Button>
              )}
              {onDismiss && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => onDismiss(insight)}
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
          
          <Button 
            size="sm"
            variant="ghost"
            className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1"
            onClick={handleViewDetails}
          >
            {compact ? 'Details' : 'View Details'}
            <ArrowRightIcon className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 