"use client"

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon, RefreshCwIcon, LightbulbIcon } from 'lucide-react'
import Image from 'next/image'
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
    <div className="bg-white rounded-lg shadow p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-sm sm:text-base font-semibold">AI Savings Insights</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-500 hover:text-gray-700 p-1 sm:p-2 h-auto"
            onClick={handleRefresh}
          >
            <RefreshCwIcon className="w-4 h-4" />
            <span className="sr-only">Refresh</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-primary/80 p-1 sm:p-2 h-auto flex items-center"
            onClick={handleViewAll}
          >
            <span className="text-xs hidden sm:inline mr-1">View All</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {hasInsights ? (
        <div className="space-y-3">
          {insights.map((insight) => (
            <AIInsightCard 
              key={insight.id} 
              insight={insight} 
              compact={true} 
            />
          ))}
          
          <Button 
            variant="outline" 
            className="w-full mt-3 text-primary border-primary hover:bg-primary hover:text-white"
            onClick={handleViewAll}
          >
            See All Insights
          </Button>
        </div>
      ) : (
        <div className="text-center py-4 sm:py-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <LightbulbIcon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
          </div>
          <h3 className="text-sm sm:text-base font-medium mb-1">No tips yet</h3>
          <p className="text-xs sm:text-sm text-gray-500 px-2">
            Join or create a savings group to start getting smart tips
            that help you stay on track.
          </p>
          <Button
            variant="outline"
            className="mt-4 text-primary border-primary hover:bg-primary hover:text-white"
            onClick={handleRefresh}
          >
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            Refresh Tips
          </Button>
        </div>
      )}
    </div>
  )
} 