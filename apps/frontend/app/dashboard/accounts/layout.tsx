"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Tab = {
  name: string
  href: string
}

const tabs: Tab[] = [
  { name: 'Profile', href: '/dashboard/account/profile' },
  { name: 'Notifications', href: '/dashboard/account/notifications' },
  { name: 'Settings', href: '/dashboard/account/settings' },
]

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-xl font-display font-semibold text-brand-ink mb-4">Account</h1>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6 -mb-px">
          {tabs.map(tab => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                isActive(tab.href)
                  ? 'border-brand-ink text-brand-ink'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="pt-6">
        {children}
      </div>
    </div>
  )
}