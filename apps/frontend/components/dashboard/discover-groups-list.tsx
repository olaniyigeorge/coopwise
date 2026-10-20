"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Check, Copy, KeyRound, Loader2 } from 'lucide-react'

import GroupCard from './group-card'
import { Pagination } from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import CooperativeService from '@/services/cooperative-service'
import type { Cooperative } from '@/types/cooperative'

interface DiscoverGroupsListProps {
  searchQuery: string
  suggestedGroups?: Cooperative[]
  /** Cooperatives the viewer is already a member of or created. */
  excludeIds?: string[]
  isLoading?: boolean
}

const LIMIT = 6

export default function DiscoverGroupsList({
  searchQuery,
  suggestedGroups = [],
  excludeIds = [],
  isLoading = false,
}: DiscoverGroupsListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteGroupName, setInviteGroupName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  // Never show a cooperative the viewer already belongs to — or created.
  // The parent filters too, but keeping the guard here means a future caller
  // can't accidentally reintroduce the "join your own group" case.
  const discoverable = useMemo(() => {
    const excluded = new Set(excludeIds)
    return suggestedGroups.filter((group) => !excluded.has(group.id))
  }, [suggestedGroups, excludeIds])

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return discoverable
    return discoverable.filter((group) =>
      group.name.toLowerCase().includes(query)
    )
  }, [discoverable, searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, excludeIds, suggestedGroups])

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / LIMIT))
  const page = Math.min(currentPage, totalPages)
  const paginatedGroups = filteredGroups.slice((page - 1) * LIMIT, page * LIMIT)

  async function handleRequestInvite(group: Cooperative) {
    setInviteGroupName(group.name)
    setInviteCode('')
    setCopied(false)
    setInviteOpen(true)
    setGenerating(true)
    try {
      const data = await CooperativeService.generateInviteCode(group.id)
      setInviteCode(data.invite_code || '')
    } catch (error) {
      console.error('Error generating invite code:', error)
      setInviteOpen(false)
      toast({
        title: 'Could not create an invite code',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast({
        title: 'Copy failed',
        description: 'Select the code and copy it manually.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[186px] animate-pulse rounded-[22px] bg-content/[0.04]"
          />
        ))}
      </div>
    )
  }

  if (filteredGroups.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-content/12 px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-content/[0.05] text-content/45">
          <KeyRound className="h-6 w-6" strokeWidth={1.8} />
        </div>
        <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-content">
          {searchQuery ? 'No matches' : 'Nothing to discover yet'}
        </h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-content/45">
          {searchQuery
            ? `No cooperatives match “${searchQuery}”.`
            : 'You’re already in every cooperative here. Ask a member for an invite to join another.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {paginatedGroups.map((group) => (
          <GroupCard
            key={group.id}
            id={group.id}
            name={group.name}
            description={group.description || ''}
            coopModel={group.coop_model}
            badge={group.status}
            onRequestInvite={() => handleRequestInvite(group)}
          />
        ))}
      </div>

      {filteredGroups.length > LIMIT && (
        <div className="flex justify-center pt-2">
          <Pagination
            totalPages={totalPages}
            currentPage={page}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              Invite code
            </DialogTitle>
            <DialogDescription>
              Share this 8-character code with anyone you want to join{' '}
              {inviteGroupName || 'this cooperative'}.
            </DialogDescription>
          </DialogHeader>

          {generating ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-content/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating a code…
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-content/10 bg-content/[0.02] px-4 py-6 text-center">
                <p className="font-display text-2xl font-bold uppercase tracking-[0.3em] text-content">
                  {inviteCode || '—'}
                </p>
              </div>
              <p className="text-xs leading-relaxed text-content/45">
                Codes are single-use per person and can be typed in any case.
              </p>
            </div>
          )}

          <DialogFooter className="flex-row gap-2 space-x-0 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setInviteOpen(false)}
              className="h-11 flex-1 rounded-full border-content/15 bg-transparent text-sm font-semibold text-content/70 hover:bg-content/[0.04] hover:text-content"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={copyToClipboard}
              disabled={!inviteCode || generating}
              className="h-11 flex-1 rounded-full bg-[#0E3B2E] text-sm font-semibold text-white hover:bg-[#0A2E24] dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:hover:bg-[#93CBAE]"
            >
              {copied ? (
                <>
                  <Check className="mr-1.5 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-4 w-4" />
                  Copy code
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
