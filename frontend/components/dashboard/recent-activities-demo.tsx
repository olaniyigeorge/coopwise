"use client"

import React from 'react'
import RecentActivities from './recent-activities'
import { mockActivities } from '@/lib/mock-data'

export default function RecentActivitiesDemo() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Recent Activities Demo</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities Component */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities Component</h2>
            <RecentActivities 
              activities={mockActivities} 
              currentUserId="1"
            />
          </div>
          
          {/* Raw Data Display */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Raw Activity Data</h2>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <pre className="text-xs text-gray-700 overflow-auto max-h-96">
                {JSON.stringify(mockActivities, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

