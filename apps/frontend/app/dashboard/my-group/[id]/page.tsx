"use client"

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

// The real cooperative detail page (members, goals, invite, activity) lives
// at /dashboard/cooperative/[id] — this route only still exists because
// older links (group cards, bookmarks) point here.
export default function MyGroupDetailRedirect() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  useEffect(() => {
    if (id) router.replace(`/dashboard/cooperative/${id}`)
  }, [id, router])

  return null
}
