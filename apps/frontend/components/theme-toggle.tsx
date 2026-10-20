'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

type ThemeValue = (typeof THEME_OPTIONS)[number]['value']

interface ThemeToggleProps {
  className?: string
}

/**
 * Cycle-free toggle: opens a small menu so people can pick Light, Dark or
 * follow their OS setting. The icon reflects the current choice once the
 * component has mounted, which keeps the server and client markup identical.
 */
export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const active: ThemeValue =
    theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system'
  const ActiveIcon =
    THEME_OPTIONS.find((option) => option.value === active)?.icon ?? Monitor

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Change theme"
          title="Change theme"
          className={cn(
            'flex h-9 w-9 min-h-0 min-w-0 items-center justify-center rounded-full border border-content/10 bg-content/[0.02] text-content/65 transition-colors hover:bg-content/[0.06] hover:text-content focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E3B2E]/30 dark:focus-visible:ring-[#B7E3C3]/40',
            className
          )}
        >
          {mounted ? (
            <ActiveIcon className="h-[18px] w-[18px]" />
          ) : (
            <Monitor className="h-[18px] w-[18px]" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-xs">Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEME_OPTIONS.map((option) => {
          const OptionIcon = option.icon
          const isActive = mounted && active === option.value
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn('cursor-pointer text-sm', isActive && 'font-semibold')}
            >
              <OptionIcon className="mr-2 h-4 w-4" />
              {option.label}
              {isActive && <Check className="ml-auto h-4 w-4 text-brand-gold" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
