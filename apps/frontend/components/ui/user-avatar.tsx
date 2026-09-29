"use client"

import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

/**
 * The one place a person's picture is rendered. Use this instead of building
 * <Avatar>/<Image> by hand so every screen gets the same:
 *  - face-friendly cropping (see IMAGE_POSITION)
 *  - initials on a stable per-person colour when there is no picture, or the
 *    picture fails to load
 */

const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-24 w-24 text-3xl",
} as const

export type UserAvatarSize = keyof typeof SIZES

/**
 * Photos are cropped to a circle with object-cover. The default centred crop
 * cuts the top of the head on portrait photos, because faces sit in the upper
 * part of the frame — so bias the crop upward. Square and landscape photos are
 * unaffected in the axis that matters.
 */
const IMAGE_POSITION: React.CSSProperties = { objectPosition: "50% 20%" }

/** Deterministic colour so the same person always gets the same fallback. */
export function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`
}

export function avatarInitial(name?: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || "?"
}

interface UserAvatarProps {
  /** Person's display name — used for alt text, initial and fallback colour. */
  name?: string | null
  /** Profile picture URL; may be missing or broken. */
  src?: string | null
  size?: UserAvatarSize
  className?: string
  /** Replaces the initial (e.g. a group icon). */
  fallback?: React.ReactNode
  /**
   * Custom fallback styling. When given, the generated per-person colour is
   * not applied, so callers can match a surrounding theme.
   */
  fallbackClassName?: string
}

export function UserAvatar({
  name,
  src,
  size = "md",
  className,
  fallback,
  fallbackClassName,
}: UserAvatarProps) {
  const label = name?.trim() || ""
  return (
    <Avatar className={cn(SIZES[size], className)}>
      {src ? (
        <AvatarImage
          src={src}
          alt={label || "Profile picture"}
          className="object-cover"
          style={IMAGE_POSITION}
        />
      ) : null}
      <AvatarFallback
        className={cn("font-semibold text-white", fallbackClassName)}
        style={fallbackClassName ? undefined : { backgroundColor: avatarColor(label) }}
      >
        {fallback ?? avatarInitial(label)}
      </AvatarFallback>
    </Avatar>
  )
}
