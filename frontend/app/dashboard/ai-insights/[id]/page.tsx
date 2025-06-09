"use client"

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {   ArrowLeft,   Brain,  Play,  CheckCircle,  Clock,  X,  TrendingUp,  Target,  Calendar,  Users,  Award,  Zap,  DollarSign,  BarChart3,  Calculator,  Flag,  Lightbulb} from 'lucide-react'
import { mockInsights } from '@/lib/insights-mock-data'
import { 
  formatCurrency, 
  formatDate, 
  getDifficultyColor, 
  getDifficultyLabel,
  getStatusColor,
  getStatusLabel,
  getCategoryLabel,
  getCategoryIcon
} from '@/lib/insight-utils'
import { ImplementationStatus } from '@/lib/types'

export default function AIInsightDetailPage() {
  const params = useParams()
  const router = useRouter()
  
  // Find the insight by ID
  const insight = mockInsights.find(i => i.id === 'insight-1') //params.id
  
  if (!insight) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-96">
          <div className="text-center">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Insight not found
            </h2>
            <p className="text-gray-600 mb-6">
              The insight you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/dashboard/ai-insights')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Insights
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const difficultyColor = getDifficultyColor(insight.difficulty)
  const difficultyLabel = getDifficultyLabel(insight.difficulty)
  const statusColor = getStatusColor(insight.status)
  const statusLabel = getStatusLabel(insight.status)
  const categoryIconName = getCategoryIcon(insight.category) as string
  const categoryLabel = getCategoryLabel(insight.category)
  
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

  const handleStartInsight = () => {
    console.log('Starting insight:', insight.id)
  }

  const handleCompleteInsight = () => {
    console.log('Completing insight:', insight.id)
  }

  const handleDismissInsight = () => {
    console.log('Dismissing insight:', insight.id)
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/dashboard/ai-insights')}
              className="flex items-center gap-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Insight Details</h1>
              <p className="text-sm text-gray-600">{categoryLabel}</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {insight.status === ImplementationStatus.NOT_STARTED && (
              <Button 
                size="sm" 
                onClick={handleStartInsight} 
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Implementation
              </Button>
            )}
            {insight.status === ImplementationStatus.IN_PROGRESS && (
              <Button 
                size="sm" 
                onClick={handleCompleteInsight} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}
            {insight.status !== ImplementationStatus.DISMISSED && insight.status !== ImplementationStatus.COMPLETED && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDismissInsight} 
                className="border-gray-300 hover:bg-red-50 hover:border-red-400 hover:text-red-600 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
              >
                <X className="w-4 h-4 mr-2" />
                Dismiss
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <IconComponent className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{insight.title}</CardTitle>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`${statusColor}`} variant="secondary">
                        {statusLabel}
                      </Badge>
                      <Badge className={`${difficultyColor}`} variant="outline">
                        {difficultyLabel}
                      </Badge>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Progress */}
            {insight.status === ImplementationStatus.IN_PROGRESS && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Implementation Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progress</span>
                      <span>{getProgressValue()}%</span>
                    </div>
                    <Progress value={getProgressValue()} className="h-3" />
                    <p className="text-sm text-gray-600">
                      You're halfway through implementing this insight. Keep going!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Implementation Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  How to Implement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Getting Started</h4>
                    <p className="text-sm text-blue-700">
                      Follow these simple steps to implement this insight and start saving money.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-600">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Assess Your Current Situation</h4>
                        <p className="text-sm text-gray-600">Review your current habits and identify areas for improvement.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-600">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Create an Action Plan</h4>
                        <p className="text-sm text-gray-600">Set specific goals and timelines for implementation.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-600">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Track Your Progress</h4>
                        <p className="text-sm text-gray-600">Monitor your improvements and adjust as needed.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Savings Overview */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <TrendingUp className="w-5 h-5" />
                  Savings Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-green-600 mb-1">Potential Savings</p>
                    <p className="text-2xl font-bold text-green-800">
                      {formatCurrency(insight.estimatedSavings)}
                    </p>
                    <p className="text-sm text-green-600">per {insight.timeframe}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-600 mb-1">Implementation Time</p>
                    <p className="text-lg font-semibold text-green-800">
                      {insight.implementationTime}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Success Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Success Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insight.metadata?.successRate && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Success Rate</span>
                        <span>{insight.metadata.successRate}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-300"
                          style={{ width: `${insight.metadata.successRate}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {insight.metadata?.usersImplemented && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Users Tried</span>
                      <span className="text-sm font-medium text-gray-900">
                        {insight.metadata.usersImplemented.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {insight.metadata?.averageTimeToComplete && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg. Time</span>
                      <span className="text-sm font-medium text-gray-900">
                        {insight.metadata.averageTimeToComplete}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(insight.createdAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Group */}
            {insight.group && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Related Group
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Group Name</p>
                      <p className="font-medium text-gray-900">{insight.group.name}</p>
                    </div>
                    {insight.group.description && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Description</p>
                        <p className="text-sm text-gray-700">{insight.group.description}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Members</p>
                      <p className="font-medium text-gray-900">{insight.group.totalMembers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {insight.tags && insight.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {insight.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 