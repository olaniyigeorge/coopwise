"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Define the possible cooperative status badges
type BadgeType = 'member' | 'admin' | 'active' | 'pending'

interface GroupCardProps {
  id?: string
  name: string
  description: string
  coopModel: string
  badge?: BadgeType
  isMyGroup?: boolean
  // Actions
  onRequestInvite?: () => void
  onViewDetails?: () => void
}

export default function GroupCard({
  id,
  name,
  description,
  coopModel,
  badge,
  isMyGroup = false,
  onRequestInvite
}: GroupCardProps) {

  // Function to render the appropriate badge
  const renderBadge = () => {
    if (!badge) return null

    const badgeStyles = {
      member: "bg-green-100 text-green-800",
      admin: "bg-amber-100 text-amber-800",
      active: "bg-green-100 text-green-800",
      pending: "bg-amber-100 text-amber-800"
    }

    return (
      <span className={`text-xs px-2 py-1 rounded-md ${badgeStyles[badge]}`}>
        {badge === 'member' && 'Member'}
        {badge === 'admin' && 'Admin'}
        {badge === 'active' && 'Active'}
        {badge === 'pending' && 'Pending'}
      </span>
    )
  }

  // For My Cooperatives view
  const myGroupContent = (
    <div className="bg-white rounded-md p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-base font-medium">{name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 capitalize">{coopModel}</p>
        </div>
        {renderBadge()}
      </div>
      {description && (
        <p className="text-xs text-gray-600 mt-2">{description}</p>
      )}
    </div>
  );

  // For Discover Cooperatives view
  const discoverGroupContent = (
    <div className="bg-white rounded-md p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-base font-medium">{name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 capitalize">{coopModel}</p>
        </div>
        {renderBadge()}
      </div>

      <p className="text-xs text-gray-600 mb-4">
        {description || `A ${coopModel} savings cooperative`}
      </p>

      <Button
        className="w-full bg-primary hover:bg-primary text-white"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRequestInvite?.();
        }}
      >
        Request code
      </Button>
    </div>
  );

  const cardContent = isMyGroup ? myGroupContent : discoverGroupContent;

  // If it's a user's cooperative and has an ID, make it clickable to view details
  if (isMyGroup && id) {
    return (
      <Link href={`/dashboard/cooperative/${id}`} className="block">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
