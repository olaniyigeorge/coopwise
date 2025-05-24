"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {   CheckCircle,   Play,   X,  ArrowRight,  Clock,  Zap,  DollarSign,  TrendingUp,  BarChart3,  Target,  Calculator,  Flag,  Lightbulb} from 'lucide-react'
import { AIInsight, ImplementationStatus } from '@/lib/types'
import { 
  formatCurrency, 
  getDifficultyColor, 
  getDifficultyLabel,
  getStatusColor,
  getStatusLabel,
  getCategoryIcon
} from '@/lib/insight-utils'

interface AIInsightCardProps {
  insight: AIInsight
  onStart?: (insight: AIInsight) => void
  onComplete?: (insight: AIInsight) => void
  onDismiss?: (insight: AIInsight) => void
}

export default function AIInsightCard({
  insight,
  onStart,
  onComplete,
  onDismiss
}: AIInsightCardProps) {
  const router = useRouter()
  
  const difficultyColor = getDifficultyColor(insight.difficulty)
  const difficultyLabel = getDifficultyLabel(insight.difficulty)
  const statusColor = getStatusColor(insight.status)
  const statusLabel = getStatusLabel(insight.status)
  const categoryIconName = getCategoryIcon(insight.category) as string
  
  const iconComponents = {
    Zap,
    DollarSign,
    TrendingUp,
    BarChart3,
    Target,
    Calculator,
    Flag,
    Lightbulb
  }
  
  const IconComponent = iconComponents[categoryIconName as keyof typeof iconComponents] || Lightbulb

  const handleViewDetails = () => {
    router.push(`/dashboard/ai-insights/${insight.id}`)
  }

  const getProgressValue = () => {
    switch (insight.status) {
      case ImplementationStatus.COMPLETED:
        return 100
      case ImplementationStatus.IN_PROGRESS:
        return 50
      case ImplementationStatus.NOT_STARTED:
        return 0
      default:
        return 0
    }
  }

  const getStatusIcon = () => {
    switch (insight.status) {
      case ImplementationStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-emerald-600" />
      case ImplementationStatus.IN_PROGRESS:
        return <Clock className="w-4 h-4 text-blue-600" />
      default:
        return null
    }
  }

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border border-blue-100 hover:border-blue-300 bg-gradient-to-r from-white to-blue-50/30 cursor-pointer transform hover:scale-[1.02] hover:-translate-y-1">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center flex-shrink-0 group-hover:shadow-md transition-all duration-300 shadow-sm">
              <IconComponent className="w-6 h-6 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base leading-tight mb-2 group-hover:text-blue-700 transition-colors">
                {insight.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {insight.description}
              </p>
            </div>
          </div>
        </div>

        {/* Status and Difficulty */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge className={`text-xs ${statusColor}`} variant="secondary">
              {statusLabel}
            </Badge>
          </div>
          <Badge className={`text-xs ${difficultyColor}`} variant="outline">
            {difficultyLabel}
          </Badge>
        </div>

        {/* Savings */}
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-4 mb-4 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-600 font-medium mb-1">Potential Savings</p>
              <p className="text-lg font-bold text-emerald-800">
                {formatCurrency(insight.estimatedSavings)}
              </p>
              <p className="text-xs text-emerald-600">per {insight.timeframe}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-600 font-medium mb-1">Time to Implement</p>
              <p className="text-sm font-semibold text-emerald-800">
                {insight.implementationTime}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar for In Progress items */}
        {insight.status === ImplementationStatus.IN_PROGRESS && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span className="font-medium">Implementation Progress</span>
              <span className="font-semibold text-blue-600">{getProgressValue()}%</span>
            </div>
            <Progress value={getProgressValue()} className="h-3 bg-gray-100" />
          </div>
        )}

        {/* Tags */}
        {insight.tags && insight.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {insight.tags.slice(0, 2).map((tag, index) => (
              <span 
                key={index}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
              >
                {tag}
              </span>
            ))}
            {insight.tags.length > 2 && (
              <span className="text-xs text-gray-400 px-2 py-1">
                +{insight.tags.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {insight.status === ImplementationStatus.NOT_STARTED && onStart && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onStart(insight)
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
          )}
          
          {insight.status === ImplementationStatus.IN_PROGRESS && onComplete && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onComplete(insight)
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              handleViewDetails()
            }}
            className="flex-1 border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
          >
            View Details
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {insight.status !== ImplementationStatus.COMPLETED && insight.status !== ImplementationStatus.DISMISSED && onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onDismiss(insight)
              }}
              className="px-3 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 transform hover:scale-[1.05]"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Footer */}
        {insight.metadata?.usersImplemented && (
          <div className="text-xs text-gray-400 text-center pt-4 mt-4 border-t border-gray-100">
            {insight.metadata.usersImplemented.toLocaleString()} users have tried this insight
          </div>
        )}
      </CardContent>
    </Card>
  )
} 