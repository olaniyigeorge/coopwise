"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function EmptyGroupState() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <h3 className="text-lg font-medium mb-3">You don&apos;t have any group yet</h3>
      <p className="text-sm text-gray-600 mb-6">
        Create a group or join an existing one to start saving together
      </p>
      
      <div className="flex justify-center gap-4">
        <Button asChild className="bg-primary text-white">
          <Link href="/dashboard/join-group">Join a Group</Link>
        </Button>
        
        <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
          <Link href="/dashboard/create-group">Create a Group</Link>
        </Button>
      </div>
    </div>
  )
} 