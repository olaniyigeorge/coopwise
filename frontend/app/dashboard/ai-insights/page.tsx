"use client"

import React, { useState, useMemo } from 'react'
import DashboardLayout from '@/components/dashboard/layout'
import AIInsightCard from '@/components/dashboard/ai-insight-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  RefreshCw, 
  Brain,
  Sparkles,
  TrendingUp,
  Filter,
  X,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  AIInsight, 
  InsightCategory, 
  ImplementationStatus
} from '@/lib/types'
import { 
  getUserInsights,
} from '@/lib/insights-mock-data'
import { 
  calculateInsightSummary,
  filterInsights
} from '@/lib/insight-utils'

interface SimpleFilters {
  status?: ImplementationStatus
  category?: InsightCategory
  searchQuery?: string
}

export default function AIInsightsPage() {
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Get user insights
  const allInsights = useMemo(() => getUserInsights('1'), [])

  // Apply filters
  const filteredInsights = useMemo(() => {
    let filtered = [...allInsights]

    // Apply search
    if (searchQuery.trim()) {
      filtered = filterInsights(filtered, { searchQuery })
    }

    // Apply status filter
    if (activeFilter !== 'all') {
      switch (activeFilter) {
        case 'actionable':
          filtered = filtered.filter(i => 
            i.status === ImplementationStatus.NOT_STARTED || 
            i.status === ImplementationStatus.IN_PROGRESS
          )
          break
        case 'completed':
          filtered = filtered.filter(i => i.status === ImplementationStatus.COMPLETED)
          break
      }
    }

    return filtered
  }, [allInsights, searchQuery, activeFilter])

  // Calculate summary
  const summary = useMemo(() => 
    calculateInsightSummary(filteredInsights), 
    [filteredInsights]
  )

  const handleRefresh = () => {
    console.log('Refreshing insights...')
    // In a real app, this would fetch new insights
  }

  const handleInsightAction = (insight: AIInsight, action: string) => {
    console.log(`${action} insight:`, insight.id)
    // In a real app, this would update the insight status
  }

  // Filter options
  const filterOptions = [
    { 
      key: 'all', 
      label: 'All Insights', 
      count: allInsights.length 
    },
    { 
      key: 'actionable', 
      label: 'Actionable', 
      count: allInsights.filter(i => 
        i.status === ImplementationStatus.NOT_STARTED || 
        i.status === ImplementationStatus.IN_PROGRESS
      ).length 
    },
    { 
      key: 'completed', 
      label: 'Completed', 
      count: allInsights.filter(i => i.status === ImplementationStatus.COMPLETED).length 
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex justify-end">
          <Button 
            onClick={handleRefresh} 
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Insights</p>
                  <p className="text-2xl font-bold text-blue-800">{summary.totalInsights}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-emerald-600 font-medium">Potential Savings</p>
                  <p className="text-2xl font-bold text-emerald-800">₦{summary.totalPotentialSavings.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-indigo-600 font-medium">Completed</p>
                  <p className="text-2xl font-bold text-indigo-800">{summary.completedInsights}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-blue-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5 transition-colors duration-300" />
                <Input
                  placeholder="Search insights, tips, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-blue-200 bg-blue-50/30 focus:border-blue-400 focus:ring-blue-500 focus:bg-white transition-all duration-300 placeholder:text-blue-400"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((option) => (
                  <Button
                    key={option.key}
                    variant={activeFilter === option.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(option.key)}
                    className={cn(
                      "flex items-center gap-2 transition-all duration-300 transform",
                      activeFilter === option.key 
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg scale-[1.02]" 
                        : "border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 shadow-sm hover:shadow-md hover:scale-[1.02]"
                    )}
                  >
                    {option.label}
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs transition-all duration-300",
                        activeFilter === option.key 
                          ? "bg-white/20 text-white" 
                          : "bg-blue-100 text-blue-700 group-hover:bg-blue-200"
                      )}
                    >
                      {option.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div>
          {filteredInsights.length === 0 ? (
            <Card className="border-blue-100 bg-gradient-to-r from-blue-50/30 to-indigo-50/30">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4 shadow-md">
                    <Brain className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No insights found
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md">
                    {searchQuery 
                      ? 'Try adjusting your search terms or browse all insights' 
                      : 'Check back soon for new AI-powered recommendations'
                    }
                  </p>
                  <div className="flex gap-3">
                    {searchQuery && (
                      <Button 
                        variant="outline" 
                        onClick={() => setSearchQuery('')} 
                        className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
                      >
                        Clear Search
                      </Button>
                    )}
                    <Button 
                      onClick={handleRefresh} 
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Insights
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {filteredInsights.length} Insight{filteredInsights.length !== 1 ? 's' : ''}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {activeFilter === 'all' && 'All your personalized recommendations'}
                    {activeFilter === 'actionable' && 'Ready to implement'}
                    {activeFilter === 'completed' && 'Successfully completed'}
                  </p>
                </div>
              </div>

              {/* Insights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInsights.map((insight) => (
                  <AIInsightCard
                    key={insight.id}
                    insight={insight}
                    onStart={(insight) => handleInsightAction(insight, 'start')}
                    onComplete={(insight) => handleInsightAction(insight, 'complete')}
                    onDismiss={(insight) => handleInsightAction(insight, 'dismiss')}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
} 