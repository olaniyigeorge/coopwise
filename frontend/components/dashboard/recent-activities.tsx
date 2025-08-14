"use client"

import React from 'react'
import { ActivityDetail } from '@/lib/dashboard-service'
import { getActivityDescription } from '@/lib/utils'
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  TrendingUp,
  Calendar,
  User
} from 'lucide-react'

interface RecentActivitiesProps {
  activities: ActivityDetail[]
  currentUserId?: string
  className?: string
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'created_group':
      return <Users className="w-4 h-4 text-blue-600" />
    case 'joined_group':
      return <UserPlus className="w-4 h-4 text-green-600" />
    case 'left_group':
      return <UserMinus className="w-4 h-4 text-red-600" />
    case 'accepted_invite':
      return <CheckCircle className="w-4 h-4 text-green-600" />
    case 'declined_invite':
      return <XCircle className="w-4 h-4 text-red-600" />
    case 'made_contribution':
      return <DollarSign className="w-4 h-4 text-emerald-600" />
    case 'received_payout':
      return <TrendingUp className="w-4 h-4 text-purple-600" />
    case 'updated_profile':
      return <User className="w-4 h-4 text-indigo-600" />
    default:
      return <Users className="w-4 h-4 text-gray-600" />
  }
}

const getActivityIconBg = (type: string) => {
  switch (type) {
    case 'created_group':
      return 'bg-blue-50'
    case 'joined_group':
      return 'bg-green-50'
    case 'left_group':
      return 'bg-red-50'
    case 'accepted_invite':
      return 'bg-green-50'
    case 'declined_invite':
      return 'bg-red-50'
    case 'made_contribution':
      return 'bg-emerald-50'
    case 'received_payout':
      return 'bg-purple-50'
    case 'updated_profile':
      return 'bg-indigo-50'
    default:
      return 'bg-gray-50'
  }
}

const formatActivityDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return 'Today'
  } else if (diffDays === 2) {
    return 'Yesterday'
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

export default function RecentActivities({ 
  activities, 
  currentUserId, 
  className = "" 
}: RecentActivitiesProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-4 sm:p-5 ${className}`}>
        <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-gray-600" />
          Recent Activity
        </h2>
        
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-2">No activity to show</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            You don&apos;t have any transactions or updates yet. Create a group or join an existing one to start saving together.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 sm:p-5 ${className}`}>
      <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2 text-gray-600" />
        Recent Activity
      </h2>
      
      <div className="space-y-4">
        {activities.slice(0, 8).map((activity) => {
          const isOwnActivity = activity.user_id === currentUserId
          const activityType = activity.type as string
          
          return (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityIconBg(activityType)}`}>
                {getActivityIcon(activityType)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 leading-relaxed">
                  {getActivityDescription(activity, isOwnActivity)}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {formatActivityDate(activity.created_at)}
                  </span>
                  {activity.amount && (
                    <>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-xs font-medium text-gray-700">
                        {new Intl.NumberFormat('en-NG', {
                          style: 'currency',
                          currency: 'NGN',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(activity.amount)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {activities.length > 8 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button className="w-full text-sm text-gray-600 hover:text-gray-900 py-2 rounded-md hover:bg-gray-50 transition-colors">
            View all activities
          </button>
        </div>
      )}
    </div>
  )
}
