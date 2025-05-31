"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'

interface GroupSummaryProps {
  name: string
  memberCount: number
  amount: string
  frequency: string
  status: 'Full' | 'Open'
}

// A simpler version of the group card for the dashboard
const GroupSummary = ({ name, memberCount, amount, frequency, status }: GroupSummaryProps) => {
  const statusColor = status === 'Full' 
    ? 'bg-amber-50 text-amber-800' 
    : 'bg-green-50 text-green-800'

  return (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-teal-600 rounded-full"></div>
            <h3 className="text-gray-900 font-medium">{name}</h3>
          </div>
          <p className="text-sm text-gray-500 mt-1">{memberCount} members • {amount} {frequency}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
          {status}
        </span>
      </div>
    </div>
  )
}

export default function DashboardGroupsSection() {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState<'my-groups' | 'discover'>('my-groups')

  // Mock data for the example
  const myGroups = [
    {
      id: '1',
      name: 'Tailors Association',
      memberCount: 15,
      amount: '₦2,000',
      frequency: 'monthly',
      status: 'Full' as const
    },
    {
      id: '2',
      name: 'Oja Connect',
      memberCount: 9,
      amount: '₦2,000',
      frequency: 'monthly',
      status: 'Open' as const
    }
  ]

  const discoverGroups = [
    {
      id: '3',
      name: 'Market Traders',
      memberCount: 12,
      amount: '₦5,000',
      frequency: 'weekly',
      status: 'Open' as const
    },
    {
      id: '4',
      name: 'Community Support',
      memberCount: 18,
      amount: '₦1,000',
      frequency: 'daily',
      status: 'Open' as const
    }
  ]

  // Navigate to the full view - ONLY when View All is clicked
  const handleViewAll = () => {
    if (activeTab === 'my-groups') {
      router.push('/dashboard/my-group')
    } else {
      router.push('/dashboard/discover-groups')
    }
  }

  // Switch tabs without redirecting
  const handleTabChange = (tab: 'my-groups' | 'discover') => {
    setActiveTab(tab)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex rounded-lg overflow-hidden">
        <button 
          className={`flex-1 py-2 sm:py-3 px-3 sm:px-6 text-center text-sm sm:text-base font-medium transition-all duration-300 ${
            activeTab === 'my-groups' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => handleTabChange('my-groups')}
        >
          My Groups
        </button>
        <button 
          className={`flex-1 py-2 sm:py-3 px-3 sm:px-6 text-center text-sm sm:text-base font-medium transition-all duration-300 ${
            activeTab === 'discover' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => handleTabChange('discover')}
        >
          Discover Groups
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {activeTab === 'my-groups' && (
          <>
            {myGroups.length > 0 ? (
              <>
                <div className="mb-3">
                  {myGroups.map((group) => (
                    <GroupSummary 
                      key={group.id}
                      name={group.name}
                      memberCount={group.memberCount}
                      amount={group.amount}
                      frequency={group.frequency}
                      status={group.status}
                    />
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-200"
                  onClick={handleViewAll}
                >
                  View all
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <h3 className="text-base font-medium mb-2">You don't have any group yet</h3>
                <p className="text-sm text-gray-600 mb-4">Create a group or join an existing one to start saving together</p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-2">
                  <Button 
                    variant="default" 
                    className="font-medium text-sm"
                    onClick={() => router.push('/dashboard/create-group')}
                  >
                    Create a Group
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-sm"
                    onClick={() => handleTabChange('discover')}
                  >
                    Join a Group
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        
        {activeTab === 'discover' && (
          <>
            {discoverGroups.length > 0 ? (
              <>
                <div className="mb-3">
                  {discoverGroups.map((group) => (
                    <GroupSummary 
                      key={group.id}
                      name={group.name}
                      memberCount={group.memberCount}
                      amount={group.amount}
                      frequency={group.frequency}
                      status={group.status}
                    />
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-200"
                  onClick={handleViewAll}
                >
                  View all
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <h3 className="text-base font-medium mb-2">No groups to discover yet</h3>
                <p className="text-sm text-gray-600 mb-4">Check back soon or create your own group</p>
                
                <Button 
                  variant="default" 
                  className="font-medium text-sm"
                  onClick={() => router.push('/dashboard/create-group')}
                >
                  Create a Group
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 