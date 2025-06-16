"use client"

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/layout'
import AIInsightCard from '@/components/dashboard/ai-insight-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  RefreshCw, 
  Brain,
  Sparkles,
  TrendingUp,
  LightbulbIcon,
  Wallet,
  PiggyBank,
  DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  AIInsight, 
  InsightCategory, 
  ImplementationStatus,
  DifficultyLevel
} from '@/lib/types'
import { getUserInsights } from '@/lib/insights-mock-data'
import { calculateInsightSummary, filterInsights } from '@/lib/insight-utils'

export default function AIInsightsPage() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  // Get user insights
  const allInsights = useMemo(() => getUserInsights('1'), [])

  // Apply filters
  const filteredInsights = useMemo(() => {
    let filtered = [...allInsights]

    // Apply search
    if (searchQuery.trim()) {
      filtered = filterInsights(filtered, { searchQuery })
    }

    // Apply tab filter
    if (activeTab !== 'all') {
      switch (activeTab) {
        case 'reduce-expenses':
          filtered = filtered.filter(i => 
            i.category === InsightCategory.EXPENSE_REDUCTION
          )
          break
        case 'increase-income':
          filtered = filtered.filter(i => 
            i.category === InsightCategory.INCOME_INCREASE
          )
          break
        case 'habits':
          filtered = filtered.filter(i => 
            i.category === InsightCategory.FINANCIAL_HABITS
          )
          break
      }
    }

    // Apply status filter
    if (activeFilter !== 'all') {
      switch (activeFilter) {
        case 'easy':
          filtered = filtered.filter(i => i.difficulty === DifficultyLevel.EASY)
          break
        case 'medium':
          filtered = filtered.filter(i => i.difficulty === DifficultyLevel.MEDIUM)
          break
        case 'hard':
          filtered = filtered.filter(i => i.difficulty === DifficultyLevel.HARD)
          break
      }
    }

    return filtered
  }, [allInsights, searchQuery, activeFilter, activeTab])

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

  // Tab-specific content
  const renderTabSpecificContent = () => {
    if (activeTab === 'all' || filteredInsights.length === 0) {
      return null
    }

    switch (activeTab) {
      case 'reduce-expenses':
  return (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Reduce Your Expenses</h3>
                  <p className="text-sm text-blue-800 mb-4">
                    Small changes in your spending habits can lead to significant savings over time. 
                    These tips will help you identify unnecessary expenses and reduce your monthly costs.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-200 text-blue-800 hover:bg-blue-300">utilities</Badge>
                    <Badge className="bg-blue-200 text-blue-800 hover:bg-blue-300">subscriptions</Badge>
                    <Badge className="bg-blue-200 text-blue-800 hover:bg-blue-300">shopping</Badge>
                    <Badge className="bg-blue-200 text-blue-800 hover:bg-blue-300">food</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      
      case 'increase-income':
        return (
          <Card className="mb-6 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Boost Your Income</h3>
                  <p className="text-sm text-green-800 mb-4">
                    Explore opportunities to increase your earnings through side hustles, 
                    passive income streams, or career advancement. These tips can help you 
                    grow your income and accelerate your savings goals.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-green-200 text-green-800 hover:bg-green-300">side-hustle</Badge>
                    <Badge className="bg-green-200 text-green-800 hover:bg-green-300">freelancing</Badge>
                    <Badge className="bg-green-200 text-green-800 hover:bg-green-300">skills</Badge>
                    <Badge className="bg-green-200 text-green-800 hover:bg-green-300">investments</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      
      case 'habits':
        return (
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <PiggyBank className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">Build Better Financial Habits</h3>
                  <p className="text-sm text-purple-800 mb-4">
                    Developing consistent financial habits is key to long-term success. 
                    These recommendations focus on behavior changes that can transform your 
                    relationship with money and improve your financial health.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-purple-200 text-purple-800 hover:bg-purple-300">budgeting</Badge>
                    <Badge className="bg-purple-200 text-purple-800 hover:bg-purple-300">automation</Badge>
                    <Badge className="bg-purple-200 text-purple-800 hover:bg-purple-300">tracking</Badge>
                    <Badge className="bg-purple-200 text-purple-800 hover:bg-purple-300">mindset</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      
      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Savings Insights</h1>
            <p className="text-sm text-gray-600">Get helpful suggestions based on your saving habits.</p>
          </div> */}
          
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            className="border-[#096157] hover:bg-[#096157] hover:text-white text-[#096157] shadow-sm self-end group"
          >
            <RefreshCw className="w-4 h-4 mr-2 text-[#096157] group-hover:text-white" />
            Refresh Tips
          </Button>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-gray-100 rounded-lg p-1 flex overflow-x-auto">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium flex-shrink-0 transition-colors
              ${activeTab === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('all')}
          >
            All Tips
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium flex-shrink-0 transition-colors
              ${activeTab === 'reduce-expenses' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('reduce-expenses')}
          >
            Reduce expenses
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium flex-shrink-0 transition-colors
              ${activeTab === 'increase-income' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('increase-income')}
          >
            Increase Income
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium flex-shrink-0 transition-colors
              ${activeTab === 'habits' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('habits')}
          >
            Habits
          </button>
        </div>

        {/* Tab-specific content */}
        {renderTabSpecificContent()}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
              placeholder="Search tips..."
              className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className={`border-gray-300 ${activeFilter === 'all' ? 'bg-gray-100' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </Button>
            <Button
              variant="outline"
              className={`border-gray-300 ${activeFilter === 'easy' ? 'bg-gray-100' : ''}`}
              onClick={() => setActiveFilter('easy')}
            >
              Easy
            </Button>
                  <Button
              variant="outline" 
              className={`border-gray-300 ${activeFilter === 'medium' ? 'bg-gray-100' : ''}`}
              onClick={() => setActiveFilter('medium')}
                  >
              Medium
            </Button>
            <Button
              variant="outline"
              className={`border-gray-300 ${activeFilter === 'hard' ? 'bg-gray-100' : ''}`}
              onClick={() => setActiveFilter('hard')}
                    >
              Hard
                  </Button>
              </div>
            </div>

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
                  <div className="flex gap-3 justify-center">
                    {searchQuery && (
                      <Button 
                        variant="outline" 
                        onClick={() => setSearchQuery('')} 
                      >
                        Clear Search
                      </Button>
                    )}
                    <Button 
                      onClick={handleRefresh} 
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
              {/* Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInsights.map((insight) => (
                  <div key={insight.id} className="flex flex-col h-full">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col h-full">
                      <div className="flex justify-between mb-3">
                        <Badge 
                          className={
                            insight.difficulty === DifficultyLevel.EASY 
                              ? "bg-green-100 text-green-800 hover:bg-green-200" 
                              : insight.difficulty === DifficultyLevel.MEDIUM
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }
                        >
                          {insight.difficulty === DifficultyLevel.EASY ? "Easy" : 
                           insight.difficulty === DifficultyLevel.MEDIUM ? "Medium" : "Hard"}
                        </Badge>
                        <div className="text-sm font-medium text-green-700">
                          ₦{insight.estimatedSavings.toLocaleString()}/{insight.timeframe}
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <LightbulbIcon className="w-4 h-4 text-orange-500" />
                        </div>
                <div>
                          <h3 className="font-medium text-gray-900 mb-1">{insight.title}</h3>
                          <p className="text-sm text-gray-600">{insight.description}</p>
                </div>
              </div>

                      <div className="mt-auto pt-3 flex justify-end">
                        <Button
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm p-2"
                          onClick={() => router.push(`/dashboard/ai-insights/${insight.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
} 