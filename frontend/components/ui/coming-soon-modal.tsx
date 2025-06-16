"use client"

import React, { useState } from 'react'
import { 
  AlertCircle, 
  X,
  Clock,
  Construction
} from 'lucide-react'
import { Button } from './button'
import { Card } from './card'
import { cn } from '@/lib/utils'

interface ComingSoonModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  className?: string
}

export function ComingSoonModal({
  isOpen,
  onClose,
  title = "Coming Soon",
  description = "This feature is currently under development and will be available soon. Thank you for your patience!",
  className
}: ComingSoonModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card 
        className={cn(
          "w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden",
          "transform transition-all",
          "animate-in fade-in zoom-in-95 duration-300",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Construction className="h-6 w-6 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full" 
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          <Button 
            className="w-full bg-primary hover:bg-primary/90"
            onClick={onClose}
          >
            Got it
          </Button>
        </div>
      </Card>
    </div>
  )
}

export function useComingSoon() {
  const [isOpen, setIsOpen] = useState(false)
  
  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)
  
  return {
    isOpen,
    openModal,
    closeModal,
    ComingSoonModalComponent: (props: Omit<ComingSoonModalProps, 'isOpen' | 'onClose'>) => (
      <ComingSoonModal 
        isOpen={isOpen} 
        onClose={closeModal} 
        {...props} 
      />
    )
  }
} 