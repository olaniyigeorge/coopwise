"use client"

import React from 'react'
import Image from 'next/image'

interface BulletPointProps {
  children: React.ReactNode;
}

export function BulletPoint({ children }: BulletPointProps) {
  return (
    <div className="flex items-start space-x-2 mb-2">
      <div className="mt-1.5 min-w-5 min-h-5">
        <Image
          src="/assets/icons/Polygon 1.svg"
          alt="Bullet point"
          width={10}
          height={10}
          className="w-2.5 h-2.5"
        />
      </div>
      <span className="text-gray-600 text-sm">{children}</span>
    </div>
  )
} 