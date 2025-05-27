"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, DollarSign, Target, ArrowRight, Sparkles } from 'lucide-react'

export default function AIInsightsSummary() {
  // Mock insights data
  const insights = [
    {
      id: 1,
      title: "Optimize Monthly Savings",
      description: "Increase your savings rate by 15% with smart spending pattern analysis",
      category: "Financial",
      impact: "High",
      savings: 25000
    },
    {
      id: 2,
      title: "Join Energy Savings Group",
      description: "Save ₦15,000 monthly by joining our energy-focused collective",
      category: "Groups",
      impact: "Medium", 
      savings: 15000
    }
  ]

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'bg-green-100 text-green-700 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return `₦${(amount / 1000).toFixed(0)}k`
  }

  return (
    <Card className="bg-white border-blue-200 hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">AI Insights</CardTitle>
              <p className="text-sm text-gray-600">Personalized recommendations</p>
            </div>
          </div>
          <Link href="/dashboard/ai-insights">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-gray-900">8</div>
            <div className="text-xs text-gray-600">Active</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-lg font-bold text-gray-900">₦40K</div>
            <div className="text-xs text-gray-600">Potential</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-lg font-bold text-gray-900">3</div>
            <div className="text-xs text-gray-600">Ready</div>
          </div>
        </div>

        {/* Top Insights */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">Top Recommendations</h4>
          
          {insights.map((insight) => (
            <div key={insight.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h5 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
                  {insight.title}
                </h5>
                <Badge 
                  variant="outline" 
                  className={`text-xs flex-shrink-0 ${getImpactColor(insight.impact)}`}
                >
                  {formatCurrency(insight.savings)}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {insight.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{insight.category}</span>
                <span className="text-xs font-medium text-blue-600">{insight.impact} Impact</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link href="/dashboard/ai-insights">
          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0">
            <Brain className="w-4 h-4 mr-2" />
            View All Insights
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
} 