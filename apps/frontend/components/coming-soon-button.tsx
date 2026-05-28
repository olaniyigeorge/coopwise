"use client"

import React from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import ComingSoonWrapper from '@/components/ui/coming-soon-wrapper'

interface ComingSoonButtonProps extends ButtonProps {
  title?: string
  description?: string
  children: React.ReactNode
  wrapperClassName?: string
}

/**
 * A button component that shows a "Coming Soon" modal when clicked
 * 
 * Example usage:
 * ```tsx
 * <ComingSoonButton>
 *   Start Live Chat
 * </ComingSoonButton>
 * 
 * // With custom title and description
 * <ComingSoonButton 
 *   title="Premium Feature" 
 *   description="This feature will be available in our premium plan coming next month."
 * >
 *   Export Analytics
 * </ComingSoonButton>
 * ```
 */
export default function ComingSoonButton({
  title = "Coming Soon",
  description = "This feature is currently under development and will be available soon. Thank you for your patience!",
  children,
  wrapperClassName,
  ...buttonProps
}: ComingSoonButtonProps) {
  return (
    <ComingSoonWrapper
      title={title}
      description={description}
      className={wrapperClassName}
    >
      <Button {...buttonProps}>
        {children}
      </Button>
    </ComingSoonWrapper>
  )
} 