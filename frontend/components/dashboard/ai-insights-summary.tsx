"use client"

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon, RefreshCwIcon, LightbulbIcon, SparklesIcon } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { getUserInsights } from '@/lib/insights-mock-data'
import AIInsightCard from './ai-insight-card'

export default function AIInsightsSummary() {
  const router = useRouter()
  const { user } = useAuth()
  
  // Get a limited set of insights for the dashboard
  const insights = useMemo(() => {
    const allInsights = getUserInsights(user?.id || '1')
    // Return only the first 3 insights
    return allInsights.slice(0, 3)
  }, [user?.id])
  
  const hasInsights = insights.length > 0
  
  const handleRefresh = () => {
    console.log('Refreshing insights...')
    // This would refresh insights from the server in a real app
  }
  
  const handleViewAll = () => {
    router.push('/dashboard/ai-insights')
  }
  
  return (
    <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl shadow-sm border border-blue-100/50 overflow-hidden">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-100" />
            <h2 className="text-sm sm:text-base font-semibold text-white">AI Insights</h2>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-100 hover:text-white hover:bg-white/10 p-1 h-7 w-7"
              onClick={handleRefresh}
            >
              <RefreshCwIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="sr-only">Refresh</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-100 hover:text-white hover:bg-white/10 p-1 h-7 w-7"
              onClick={handleViewAll}
            >
              <ArrowRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="sr-only">View All</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content area */}
      <div className="p-3 sm:p-4">
        {hasInsights ? (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div 
                key={insight.id} 
                className={`transform transition-all duration-300 hover:-translate-y-1 ${
                  index === 0 ? 'scale-100' : index === 1 ? 'scale-[0.98]' : 'scale-[0.96]'
                }`}
              >
                <AIInsightCard insight={insight} compact={true} />
              </div>
            ))}
            
            <div className="pt-2">
              <Button 
                variant="outline" 
                className="w-full bg-white/70 backdrop-blur-sm border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 flex items-center justify-center gap-2 group"
                onClick={handleViewAll}
              >
                <span>See All Insights</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5">
                <LightbulbIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500" />
              </div>
              <div className="absolute top-0 right-0 w-full h-full flex items-center justify-center opacity-30">
                <div className="w-full h-full absolute animate-ping bg-blue-200 rounded-full" style={{ animationDuration: '3s' }}></div>
              </div>
            </div>
            
            <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2">No insights yet</h3>
            <p className="text-sm text-gray-600 px-4 sm:px-6 max-w-xs mx-auto">
              Join or create a savings group to start getting personalized financial insights
            </p>
            
            <Button
              variant="outline"
              className="mt-5 border-blue-200 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 flex items-center justify-center gap-2"
              onClick={handleRefresh}
            >
              <RefreshCwIcon className="w-4 h-4" />
              <span>Generate Insights</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 