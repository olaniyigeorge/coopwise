"use client"

import React from 'react'
import Link from 'next/link'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-primary">CoopWise</h1>
            </div>
            <nav className="flex space-x-8">
              <Link 
                href="/dashboard" 
                className="border-primary text-primary border-b-2 px-1 pt-1 text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link 
                href="/profile" 
                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Profile
              </Link>
              <Link 
                href="/settings" 
                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Welcome to your Dashboard</h2>
          <p className="text-gray-600">
            Your profile information has been saved successfully. You can now start using the CoopWise platform.
          </p>
        </div>
      </main>
    </div>
  )
} 