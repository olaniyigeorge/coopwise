"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import JoinGroupForm from '@/components/dashboard/join-group-form'

export default function JoinGroupContent() {
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('code')
  const [initialCode, setInitialCode] = useState<string | null>(null)

  useEffect(() => {
    if (inviteCode) {
      setInitialCode(inviteCode)
    }
  }, [inviteCode])

  return <JoinGroupForm initialCode={initialCode} />
}
