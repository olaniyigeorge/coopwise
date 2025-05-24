"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface MobileResponsiveWrapperProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'card' | 'section' | 'grid' | 'flex'
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl'
}

const spacingClasses = {
  none: '',
  sm: 'space-y-2 sm:space-y-3',
  md: 'space-y-3 sm:space-y-4 lg:space-y-5',
  lg: 'space-y-4 sm:space-y-6 lg:space-y-8',
  xl: 'space-y-6 sm:space-y-8 lg:space-y-10'
}

const variantClasses = {
  default: 'w-full',
  card: 'bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6',
  section: 'w-full space-y-4 sm:space-y-6',
  grid: 'grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6',
  flex: 'flex flex-col gap-3 sm:gap-4 lg:gap-6'
}

export default function MobileResponsiveWrapper({
  children,
  className,
  variant = 'default',
  spacing = 'md',
  breakpoint = 'lg'
}: MobileResponsiveWrapperProps) {
  const baseClasses = variantClasses[variant]
  const spaceClasses = spacingClasses[spacing]
  
  return (
    <div className={cn(baseClasses, spaceClasses, className)}>
      {children}
    </div>
  )
}

// Specialized components for common patterns
export function MobileCard({ 
  children, 
  className, 
  title,
  subtitle,
  actions
}: {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className={cn("bg-white rounded-lg shadow-sm", className)}>
      {(title || subtitle || actions) && (
        <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="p-3 sm:p-4 lg:p-6">
        {children}
      </div>
    </div>
  )
}

export function MobileGrid({ 
  children, 
  className,
  cols = { base: 1, sm: 2, lg: 3 }
}: {
  children: React.ReactNode
  className?: string
  cols?: {
    base?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}) {
  const gridClasses = [
    `grid-cols-${cols.base || 1}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`
  ].filter(Boolean).join(' ')

  return (
    <div className={cn("grid gap-3 sm:gap-4 lg:gap-6", gridClasses, className)}>
      {children}
    </div>
  )
}

export function MobileStack({ 
  children, 
  className,
  spacing = 'md',
  direction = 'vertical'
}: {
  children: React.ReactNode
  className?: string
  spacing?: 'sm' | 'md' | 'lg'
  direction?: 'vertical' | 'horizontal' | 'responsive'
}) {
  const spaceMap = {
    sm: direction === 'vertical' ? 'space-y-2 sm:space-y-3' : 'space-x-2 sm:space-x-3',
    md: direction === 'vertical' ? 'space-y-3 sm:space-y-4 lg:space-y-5' : 'space-x-3 sm:space-x-4 lg:space-x-5',
    lg: direction === 'vertical' ? 'space-y-4 sm:space-y-6 lg:space-y-8' : 'space-x-4 sm:space-x-6 lg:space-x-8'
  }

  const directionClasses = {
    vertical: 'flex flex-col',
    horizontal: 'flex flex-row',
    responsive: 'flex flex-col sm:flex-row'
  }

  return (
    <div className={cn(directionClasses[direction], spaceMap[spacing], className)}>
      {children}
    </div>
  )
}

export function MobileButton({ 
  children, 
  className,
  size = 'responsive',
  fullWidth = false,
  ...props
}: {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'responsive'
  fullWidth?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm',
    md: 'px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base',
    lg: 'px-4 py-2 text-base sm:px-6 sm:py-3 sm:text-lg',
    responsive: 'px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base'
  }

  return (
    <button 
      className={cn(
        "rounded-lg font-medium transition-colors",
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function MobileText({ 
  children, 
  className,
  variant = 'body',
  truncate = false
}: {
  children: React.ReactNode
  className?: string
  variant?: 'heading' | 'subheading' | 'body' | 'caption' | 'label'
  truncate?: boolean
}) {
  const variantClasses = {
    heading: 'text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900',
    subheading: 'text-base sm:text-lg font-medium text-gray-900',
    body: 'text-sm sm:text-base text-gray-700',
    caption: 'text-xs sm:text-sm text-gray-500',
    label: 'text-xs sm:text-sm font-medium text-gray-700'
  }

  return (
    <div className={cn(
      variantClasses[variant],
      truncate && "truncate",
      className
    )}>
      {children}
    </div>
  )
} 