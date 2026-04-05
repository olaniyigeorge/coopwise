"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import JoinGroupForm from '@/components/dashboard/join-group-form'
import OpenCirclesPanel from '@/components/dashboard/open-circles-panel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function JoinGroupContent() {
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('code')
  const [initialCode, setInitialCode] = useState<string | null>(null)
  const [tab, setTab] = useState<string>('browse')

  useEffect(() => {
    if (inviteCode) {
      setInitialCode(inviteCode)
      setTab('invite')
    }
  }, [inviteCode])

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
        <TabsTrigger value="browse">Open circles</TabsTrigger>
        <TabsTrigger value="invite">Invite code</TabsTrigger>
      </TabsList>
      <TabsContent value="browse" className="mt-0">
        <p className="text-sm text-gray-600 mb-4">
          Public circles: join in one tap. Private circles stay invite-only — use the
          other tab.
        </p>
        <OpenCirclesPanel />
      </TabsContent>
      <TabsContent value="invite" className="mt-0">
        <JoinGroupForm initialCode={initialCode} />
      </TabsContent>
    </Tabs>
  )
}
