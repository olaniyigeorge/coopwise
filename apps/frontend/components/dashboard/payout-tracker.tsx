"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock } from 'lucide-react'



// Mock payout data
const mockPayouts = [
  {
    id: '1',
    type: 'Payout to Azeez Olaya',
    date: 'May 23 2025, 11:20 AM',
    amount: 100000,
    status: 'Completed',
    statusColor: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  {
    id: '2',
    type: 'Payout to Azeez Olaya',
    date: 'May 23 2025, 11:20 AM',
    amount: 100000,
    status: 'Completed',
    statusColor: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  {
    id: '3',
    type: 'Payout to Mary Benson',
    date: 'Today 5:50 PM',
    amount: 50000,
    status: 'Schedule',
    statusColor: 'bg-orange-100 text-orange-800',
    icon: Clock,
    iconColor: 'text-orange-600'
  },
  {
    id: '4',
    type: 'Payout to Mary Benson',
    date: 'Today 5:50 PM',
    amount: 50000,
    status: 'Schedule',
    statusColor: 'bg-orange-100 text-orange-800',
    icon: Clock,
    iconColor: 'text-orange-600'
  }
]

export default function PayoutTracker() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Payout Tracker</h2>
        <p className="text-sm text-gray-600">See who has been paid and who&apos;s next.</p>
      </div>

      <div className="space-y-4">
        {mockPayouts.map((payout) => {
          const IconComponent = payout.icon
          return (
            <div key={payout.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <IconComponent className={`w-4 h-4 ${payout.iconColor}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{payout.type}</p>
                  <p className="text-sm text-gray-500">{payout.date}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${payout.statusColor}`}>
                  {payout.status}
                </span>
                <p className="font-semibold text-gray-900">₦{payout.amount.toLocaleString()}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-center pt-4">
        <Button variant="outline" className="w-full">
          View all
        </Button>
      </div>
    </div>
  )
} 