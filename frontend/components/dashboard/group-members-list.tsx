"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface GroupMembersListProps {
  groupId: string
}

// Mock members data
const mockMembers = [
    {    id: '1',    name: 'You',    number: '8',    joinDate: 'Join on May 23 2025',    role: 'Member',    roleColor: 'bg-green-100 text-green-800',    avatar: '/images/test-dp.png'  },
    {    id: '2',    name: 'Admin',    number: '1',    joinDate: 'Join on May 23 2025',    role: 'Admin',    roleColor: 'bg-orange-100 text-orange-800',    avatar: '/images/test-dp.png'  },
    {    id: '3',    name: 'Justina George',    number: '2',    joinDate: 'Join on May 23 2025',    role: 'Member',    roleColor: 'bg-green-100 text-green-800',    avatar: '/images/test-dp.png'  },
    {    id: '4',    name: 'Mary Adekume',    number: '3',    joinDate: 'Join on May 23 2025',    role: 'Member',    roleColor: 'bg-green-100 text-green-800',    avatar: '/images/test-dp.png'  }
]

export default function GroupMembersList({ groupId }: GroupMembersListProps) {
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
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 relative">
                <Image 
                  src={member.avatar}
                  alt={member.name}
                  width={40}
                  height={40}
                  className="object-cover"
                  onError={(e) => {
                    // Hide broken image and show fallback
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
                {/* Fallback initials */}
                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-700 bg-gray-200" style={{ display: 'none' }}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
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