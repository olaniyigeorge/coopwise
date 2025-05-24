"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share, Calendar, Users, DollarSign } from 'lucide-react'
import ContributionHistory from './contribution-history'
import PayoutTracker from './payout-tracker'
import GroupMembersList from './group-members-list'

interface GroupDetailsViewProps {
  groupId: string
}

// Mock data - in a real app this would come from an API
const mockGroupData = {
  '1': {
    name: 'Moms Budget Circle',
    description: 'A supportive group for mothers to save for school fees, family needs, and emergency plans.',
    totalMembers: 10,
    totalSaved: 1800000,
    goal: 3000000,
    progress: 60,
    nextContribution: {
      amount: 100000,
      dueDate: 'May 25',
      daysLeft: 10,
      frequency: 'Monthly',
      status: 'Pending'
    },
    nextPayout: {
      amount: 300000,
      recipient: 'Adams Olive',
      date: 'June 16, 2025'
    }
  }
}

export default function GroupDetailsView({ groupId }: GroupDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<'contributions' | 'payouts' | 'members'>('contributions')
  
  // Get group data (in real app, this would be an API call)
  const group = mockGroupData[groupId as keyof typeof mockGroupData]
  
  if (!group) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">Group not found</h2>
        <p className="text-gray-600">The group you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Group Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{group.name}</h1>
            <p className="text-gray-600 text-sm">{group.description}</p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Share className="w-4 h-4" />
            Share invite
          </Button>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Group Savings */}
          <div className="space-y-2">
            <h3 className="text-sm text-gray-500">Group savings</h3>
            <p className="text-xs text-gray-500">{group.totalMembers} members in this group</p>
            <div className="space-y-2">
              <p className="text-2xl font-semibold text-gray-900">₦{group.totalSaved.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total saved by this group</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progress to goal</span>
                  <span>{group.progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${group.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">Goal: ₦{group.goal.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Next Contribution */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm text-gray-500">Next Contribution</h3>
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-semibold text-gray-900">₦{group.nextContribution.amount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Due on {group.nextContribution.dueDate} ({group.nextContribution.daysLeft} days to go)</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-xs">Frequency</span>
                </div>
                <span className="text-xs font-medium">{group.nextContribution.frequency}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-xs">Status</span>
                </div>
                <span className="text-xs font-medium bg-orange-100 text-orange-800 px-2 py-1 rounded">{group.nextContribution.status}</span>
              </div>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90">
              Make Contribution
            </Button>
          </div>

          {/* Next Payout */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm text-gray-500">Next Payout</h3>
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-semibold text-gray-900">₦{group.nextPayout.amount.toLocaleString()}</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs">Receiving Next</span>
                  </div>
                  <span className="text-xs font-medium">{group.nextPayout.recipient}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs">Receiving Date</span>
                  </div>
                  <span className="text-xs font-medium">{group.nextPayout.date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex">
          <button
            className={`flex-1 py-3 px-6 text-center font-medium transition-all ${
              activeTab === 'contributions'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('contributions')}
          >
            Contributions
          </button>
          <button
            className={`flex-1 py-3 px-6 text-center font-medium transition-all ${
              activeTab === 'payouts'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('payouts')}
          >
            Payouts
          </button>
          <button
            className={`flex-1 py-3 px-6 text-center font-medium transition-all ${
              activeTab === 'members'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('members')}
          >
            Group Members
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'contributions' && <ContributionHistory groupId={groupId} />}
          {activeTab === 'payouts' && <PayoutTracker groupId={groupId} />}
          {activeTab === 'members' && <GroupMembersList groupId={groupId} />}
        </div>
      </div>

      {/* Group Rules */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Group Rules</h2>
        <p className="text-sm text-gray-600 mb-4">
          These are the rules set for your group to keep things fair and organized.
        </p>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-1">Rule 1: Contribution Amount</h3>
            <p className="text-sm text-gray-600">All members must contribute ₦1,000 every week as agreed by the group.</p>
          </div>
          
          <div>
            <h3 className="font-medium mb-1">Rule 2: Payment Rotation</h3>
            <p className="text-sm text-gray-600">Payouts will follow a set order, based on the number each member selects during group setup.</p>
          </div>
          
          <div>
            <h3 className="font-medium mb-1">Rule 3: Late Payment Penalty</h3>
            <p className="text-sm text-gray-600">Members who pay after the deadline will be charged a ₦100 late fee.</p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
            Leave Group
          </Button>
        </div>
      </div>
    </div>
  )
} 