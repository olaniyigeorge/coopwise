"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/user-avatar'

interface GroupMembersListProps {
  groupId: string
}

// Mock members data
const mockMembers = [
    {    id: '1',    name: 'You',    number: '8',    joinDate: 'Join on May 23 2025',    role: 'Member',    roleColor: 'bg-green-100 text-green-800'  },
    {    id: '2',    name: 'Admin',    number: '1',    joinDate: 'Join on May 23 2025',    role: 'Admin',    roleColor: 'bg-orange-100 text-orange-800'  },
    {    id: '3',    name: 'Justina George',    number: '2',    joinDate: 'Join on May 23 2025',    role: 'Member',    roleColor: 'bg-green-100 text-green-800'  },
    {    id: '4',    name: 'Mary Adekume',    number: '3',    joinDate: 'Join on May 23 2025',    role: 'Member',    roleColor: 'bg-green-100 text-green-800'  }
]

export default function GroupMembersList({ }: GroupMembersListProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Group Members</h2>
        <p className="text-sm text-gray-600">There are 10 members in this group</p>
      </div>

      <div className="space-y-4">
        {mockMembers.map((member) => (
          <div key={member.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center gap-3">
              <UserAvatar name={member.name} size="md" />
              <div>
                <p className="font-medium text-gray-900">{member.name}/No. {member.number}</p>
                <p className="text-sm text-gray-500">{member.joinDate}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${member.roleColor}`}>
                {member.role}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Button variant="outline" className="w-full">
          View all
        </Button>
      </div>
    </div>
  )
} 