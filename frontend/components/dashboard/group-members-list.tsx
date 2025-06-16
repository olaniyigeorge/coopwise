"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

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

export default function GroupMembersList({ groupId }: GroupMembersListProps) {
  // Function to get the first name
  const getFirstName = (name: string) => {
    return name.split(' ')[0];
  }
  
  // Function to get the first letter of the first name
  const getFirstNameInitial = (name: string) => {
    const firstName = getFirstName(name);
    return firstName ? firstName[0].toUpperCase() : '';
  }
  
  // Generate a consistent color based on the user's name
  const getAvatarColor = (name: string) => {
    // Get a simple hash of the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate a hue between 0 and 360
    const hue = Math.abs(hash) % 360;
    
    // Use a consistent saturation and lightness for all avatars
    return `hsl(${hue}, 65%, 55%)`;
  }
  
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
              <Avatar className="w-10 h-10">
                <AvatarFallback 
                  style={{ 
                    backgroundColor: getAvatarColor(member.name), 
                    color: 'white' 
                  }}
                >
                  {getFirstNameInitial(member.name)}
                </AvatarFallback>
              </Avatar>
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