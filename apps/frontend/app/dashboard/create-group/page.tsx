"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// The legacy "create group" flow posted fields the backend's cooperative
// creation endpoint never accepted. The real, working flow lives at
// /dashboard/create-cooperative — redirect there instead of maintaining
// a second, broken implementation.
export default function CreateGroupRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/create-cooperative')
  }, [router])

  return null
}
