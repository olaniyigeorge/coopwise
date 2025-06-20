"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface MobileResponsiveWrapperProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'card' | 'section' | 'grid' | 'flex'
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
}

const spacingClasses = {
  none: '',
  xs: 'space-y-1 sm:space-y-2',
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
  flex: 'flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6'
}

export default function MobileResponsiveWrapper({
  children,
  className,
  variant = 'default',
  spacing = 'md',
  breakpoint = 'lg',
  fullWidth = false
}: MobileResponsiveWrapperProps) {
  const baseClasses = variantClasses[variant]
  const spaceClasses = spacingClasses[spacing]
  
  return (
    <div className={cn(
      baseClasses, 
      spaceClasses, 
      fullWidth && "w-full",
      className
    )}>
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
  actions,
  noPadding = false,
  headerBorder = true
}: {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  noPadding?: boolean
  headerBorder?: boolean
}) {
  return (
    <div className={cn("bg-white rounded-lg shadow-sm overflow-hidden", className)}>
      {(title || subtitle || actions) && (
        <div className={cn(
          "p-3 sm:p-4 lg:p-6", 
          headerBorder && "border-b border-gray-100"
        )}>
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
      <div className={cn(!noPadding && "p-3 sm:p-4 lg:p-6")}>
        {children}
      </div>
    </div>
  )
}

export function MobileGrid({ 
  children, 
  className,
  cols = { base: 1, sm: 2, lg: 3 },
  gap = "default",
  autoFit = false,
  minWidth
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
  gap?: "xs" | "sm" | "default" | "lg" | "xl"
  autoFit?: boolean
  minWidth?: string
}) {
  // Auto-fit takes precedence over cols if provided
  let gridColsClass = ''
  
  if (autoFit && minWidth) {
    gridColsClass = `grid-cols-1 grid-cols-[repeat(auto-fit,minmax(${minWidth},1fr))]`
  } else {
    const colClasses = [
      `grid-cols-${cols.base || 1}`,
      cols.sm && `sm:grid-cols-${cols.sm}`,
      cols.md && `md:grid-cols-${cols.md}`,
      cols.lg && `lg:grid-cols-${cols.lg}`,
      cols.xl && `xl:grid-cols-${cols.xl}`
    ].filter(Boolean).join(' ')
    gridColsClass = colClasses
  }

  const gapSizes = {
    xs: "gap-1 sm:gap-2",
    sm: "gap-2 sm:gap-3",
    default: "gap-3 sm:gap-4 lg:gap-6",
    lg: "gap-4 sm:gap-6 lg:gap-8",
    xl: "gap-6 sm:gap-8 lg:gap-10"
  }

  return (
    <div className={cn("grid", gapSizes[gap], gridColsClass, className)}>
      {children}
    </div>
  )
}

export function MobileStack({ 
  children, 
  className,
  spacing = 'md',
  direction = 'vertical',
  wrap = false,
  align = 'start',
  justify = 'start'
}: {
  children: React.ReactNode
  className?: string
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  direction?: 'vertical' | 'horizontal' | 'responsive'
  wrap?: boolean
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
}) {
  const spaceMap = {
    xs: direction === 'vertical' ? 'space-y-1 sm:space-y-2' : 'space-x-1 sm:space-x-2',
    sm: direction === 'vertical' ? 'space-y-2 sm:space-y-3' : 'space-x-2 sm:space-x-3',
    md: direction === 'vertical' ? 'space-y-3 sm:space-y-4 lg:space-y-5' : 'space-x-3 sm:space-x-4 lg:space-x-5',
    lg: direction === 'vertical' ? 'space-y-4 sm:space-y-6 lg:space-y-8' : 'space-x-4 sm:space-x-6 lg:space-x-8',
    xl: direction === 'vertical' ? 'space-y-6 sm:space-y-8 lg:space-y-10' : 'space-x-6 sm:space-x-8 lg:space-x-10'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around'
  }

  const directionClasses = {
    vertical: 'flex flex-col',
    horizontal: 'flex flex-row',
    responsive: 'flex flex-col sm:flex-row'
  }

  // For responsive direction, we need separate spacing classes
  const responsiveSpaceClass = direction === 'responsive' 
    ? `space-y-${spacing} sm:space-y-0 sm:space-x-${spacing}` 
    : spaceMap[spacing];

  return (
    <div className={cn(
      directionClasses[direction], 
      responsiveSpaceClass,
      alignClasses[align],
      justifyClasses[justify],
      wrap && 'flex-wrap',
      className
    )}>
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
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'responsive'
  fullWidth?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs sm:px-2 sm:py-1',
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
  truncate = false,
  as = 'div'
}: {
  children: React.ReactNode
  className?: string
  variant?: 'heading' | 'subheading' | 'body' | 'caption' | 'label'
  truncate?: boolean
  as?: React.ElementType
}) {
  const variantClasses = {
    heading: 'text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900',
    subheading: 'text-base sm:text-lg font-medium text-gray-900',
    body: 'text-sm sm:text-base text-gray-700',
    caption: 'text-xs sm:text-sm text-gray-500',
    label: 'text-xs sm:text-sm font-medium text-gray-700'
  }

  const Component = as;

  return (
    <Component className={cn(
      variantClasses[variant],
      truncate && "truncate",
      className
    )}>
      {children}
    </Component>
  )
}

export function MobileDivider({ 
  className,
  vertical = false,
  spacing = 'md'
}: {
  className?: string
  vertical?: boolean
  spacing?: 'none' | 'sm' | 'md' | 'lg'
}) {
  const spacingClasses = {
    none: '',
    sm: vertical ? 'mx-2 sm:mx-3' : 'my-2 sm:my-3',
    md: vertical ? 'mx-3 sm:mx-4 lg:mx-5' : 'my-3 sm:my-4 lg:my-5',
    lg: vertical ? 'mx-4 sm:mx-6 lg:mx-8' : 'my-4 sm:my-6 lg:my-8'
  }

  return (
    <div className={cn(
      vertical ? 'h-auto w-px self-stretch' : 'h-px w-full',
      'bg-gray-200',
      spacingClasses[spacing],
      className
    )} />
  )
}

export function MobileContainer({
  children,
  className,
  maxWidth = 'default',
  padding = true
}: {
  children: React.ReactNode
  className?: string
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'default' | 'full' | 'none'
  padding?: boolean
}) {
  const maxWidthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    default: 'max-w-screen-xl',
    full: 'max-w-full',
    none: ''
  }

  return (
    <div className={cn(
      'mx-auto w-full',
      maxWidthClasses[maxWidth],
      padding && 'px-3 sm:px-4 lg:px-6',
      className
    )}>
      {children}
    </div>
  )
} 