"use client"

import React from 'react'
import { useComingSoon, ComingSoonModal } from './coming-soon-modal'

interface ComingSoonWrapperProps {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
}

export default function ComingSoonWrapper({
  children,
  title,
  description,
  className
}: ComingSoonWrapperProps) {
  const { isOpen, openModal, closeModal } = useComingSoon()
  
  return (
    <>
      <div onClick={openModal}>
        {children}
      </div>
      <ComingSoonModal
        isOpen={isOpen}
        onClose={closeModal}
        title={title}
        description={description}
        className={className}
      />
    </>
  )
} 