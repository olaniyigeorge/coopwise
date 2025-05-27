"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Target
} from 'lucide-react'
import { ContributionSummary } from '@/lib/types'
import { formatCurrency } from '@/lib/contribution-utils'

interface ContributionSummaryProps {
  summary: ContributionSummary
  showGrowth?: boolean
  growthPercentage?: number
  className?: string
}

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'gray'
}

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue, 
  color = 'gray' 
}: StatCardProps) => {
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
    blue: 'bg-blue-50 border-blue-200',
    gray: 'bg-gray-50 border-gray-200'
  }

  const iconColorClasses = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    gray: 'text-gray-600'
  }

  return (
    <Card className={colorClasses[color]}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
            {trend && trendValue && (
              <div className="flex items-center gap-1 mt-2">
                {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-600" />}
                {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-600" />}
                <span className={`text-xs font-medium ${
                  trend === 'up' ? 'text-green-600' : 
                  trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${iconColorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ContributionSummaryComponent({
  summary,
  showGrowth = false,
  growthPercentage,
  className
}: ContributionSummaryProps) {
  const completionRate = summary.totalContributions > 0 
    ? Math.round((summary.completedContributions / summary.totalContributions) * 100)
    : 0

  const overdueRate = summary.totalContributions > 0
    ? Math.round((summary.overdueContributions / summary.totalContributions) * 100)
    : 0

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Contributions"
          value={summary.totalContributions.toString()}
          subtitle={formatCurrency(summary.totalAmount)}
          icon={<Target className="w-5 h-5" />}
          color="blue"
          trend={showGrowth && growthPercentage ? (growthPercentage > 0 ? 'up' : 'down') : undefined}
          trendValue={showGrowth && growthPercentage ? `${Math.abs(growthPercentage)}%` : undefined}
        />

        <StatCard
          title="Completed"
          value={summary.completedContributions.toString()}
          subtitle={formatCurrency(summary.completedAmount)}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />

        <StatCard
          title="Pending"
          value={summary.pendingContributions.toString()}
          subtitle={formatCurrency(summary.pendingAmount)}
          icon={<Clock className="w-5 h-5" />}
          color="yellow"
        />

        <StatCard
          title="Overdue"
          value={summary.overdueContributions.toString()}
          subtitle={formatCurrency(summary.overdueAmount)}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{completionRate}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">On-time Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${100 - overdueRate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{100 - overdueRate}%</span>
                </div>
              </div>

              {summary.overdueContributions > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      {summary.overdueContributions} contribution{summary.overdueContributions > 1 ? 's' : ''} overdue
                    </span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">
                    Total overdue amount: {formatCurrency(summary.overdueAmount)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Contribution</span>
                <span className="text-sm font-medium text-gray-900">
                  {summary.totalContributions > 0 
                    ? formatCurrency(Math.round(summary.totalAmount / summary.totalContributions))
                    : formatCurrency(0)
                  }
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Largest Contribution</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(Math.max(summary.completedAmount, summary.pendingAmount, summary.overdueAmount))}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Success Rate</span>
                <div className="flex items-center gap-2">
                  <Badge variant={completionRate >= 80 ? "default" : completionRate >= 60 ? "secondary" : "destructive"}>
                    {completionRate >= 80 ? 'Excellent' : completionRate >= 60 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(summary.totalAmount)}
                  </p>
                  <p className="text-xs text-gray-500">Total contributed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 