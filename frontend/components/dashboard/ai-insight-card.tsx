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
  SparklesIcon,
  ChevronRightIcon
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
  
  // Get status color and icon
  const getStatusData = () => {
    switch (insight.status) {
      case ImplementationStatus.COMPLETED:
        return { 
          bgColor: 'bg-green-50/80',
          borderColor: 'border-green-200',
          hoverBorder: 'hover:border-green-300',
          icon: <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />,
          iconBg: 'bg-green-100'
        }
      case ImplementationStatus.IN_PROGRESS:
        return { 
          bgColor: 'bg-blue-50/80',
          borderColor: 'border-blue-200',
          hoverBorder: 'hover:border-blue-300',
          icon: <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />,
          iconBg: 'bg-blue-100'
        }
      case ImplementationStatus.NOT_STARTED:
      default:
        return { 
          bgColor: 'bg-white',
          borderColor: 'border-slate-200',
          hoverBorder: 'hover:border-blue-200',
          icon: <LightbulbIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />,
          iconBg: 'bg-amber-100'
        }
    }
  }
  
  // Get difficulty label and color
  const getDifficultyData = () => {
    switch (insight.difficulty) {
      case DifficultyLevel.EASY:
        return { 
          label: 'Easy', 
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200' 
        }
      case DifficultyLevel.MEDIUM:
        return { 
          label: 'Medium', 
          color: 'bg-amber-100 text-amber-800 border-amber-200' 
        }
      case DifficultyLevel.HARD:
        return { 
          label: 'Hard', 
          color: 'bg-rose-100 text-rose-800 border-rose-200' 
        }
      default:
        return { 
          label: 'Easy', 
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200' 
        }
    }
  }
  
  const { bgColor, borderColor, hoverBorder, icon, iconBg } = getStatusData()
  const { label: difficultyLabel, color: difficultyColor } = getDifficultyData()
  
  // View insight details
  const handleViewDetails = () => {
    router.push(`/dashboard/ai-insights/${insight.id}`)
  }
  
  return (
    <Card 
      className={`${bgColor} backdrop-blur-sm transition-all duration-300 hover:shadow-md border ${borderColor} ${hoverBorder} rounded-lg overflow-hidden ${compact ? '' : 'hover:translate-y-[-2px]'}`}
    >
      <CardContent className={`p-0`}>
        {/* Card header with icon and badges */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`${iconBg} w-6 h-6 rounded-full flex items-center justify-center`}>
              {icon}
            </div>
            <Badge className={`${difficultyColor} text-xs px-2 py-0 h-5`} variant="outline">
              {difficultyLabel}
            </Badge>
          </div>
          <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-200 bg-emerald-50/80 px-2 py-0 h-5">
            {formatCurrency(insight.estimated_savings)}/{insight.timeframe}
          </Badge>
        </div>
        
        {/* Card content */}
        <div className="px-3 py-2">
          <h3 className={`font-medium text-slate-800 ${compact ? 'text-sm' : 'text-base'} line-clamp-2`}>
            {insight.title}
          </h3>
          
          {!compact && (
            <p className="text-sm text-slate-600 mt-2 line-clamp-3">
              {insight.description}
            </p>
          )}
        </div>
        
        {/* Card footer */}
        <div className={`flex items-center ${compact ? 'justify-end px-3 py-2' : 'justify-between px-3 py-2 border-t border-slate-100'}`}>
          {!compact && insight.status !== ImplementationStatus.COMPLETED && (
            <div className="flex gap-1.5">
              {insight.status === ImplementationStatus.NOT_STARTED && onStart && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs h-7 px-2.5 border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={() => onStart(insight)}
                >
                  Start
                </Button>
              )}
              {insight.status === ImplementationStatus.IN_PROGRESS && onComplete && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs h-7 px-2.5 border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => onComplete(insight)}
                >
                  Complete
                </Button>
              )}
              {onDismiss && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs h-7 px-2.5 border-slate-300 text-slate-700 hover:bg-slate-50"
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
            className="text-xs h-7 px-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1 ml-auto group"
            onClick={handleViewDetails}
          >
            {compact ? 'View' : 'View Details'}
            <ChevronRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 