"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import UserService from '@/lib/user-service'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const router = useRouter()
  const { user: authUser, isAuthenticated, logout } = useAuth()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    // Fetch user details from API
    const fetchUserDetails = async () => {
      if (!authUser?.id) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Get fresh user data from API
        const userDetails = await UserService.getUserById(authUser.id)
        console.log('User details from API:', userDetails)
        setUserData(userDetails)
      } catch (err: any) {
        console.error('Error fetching user details:', err)
        
        // Use local user data as fallback
        setUserData(authUser)
      } finally {
        setLoading(false)
      }
    }

    fetchUserDetails()
  }, [isAuthenticated, router, authUser])

  const firstName = userData?.full_name?.split(' ')[0] || 'User'

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-[220px] bg-primary text-white flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center space-x-2">
          <div className="text-xl font-bold">CoopWise</div>
        </div>
        <nav className="py-6 flex-1">
          <ul className="space-y-1">
            <li>
              <Link 
                href="/dashboard" 
                className="flex items-center px-4 py-3 text-white bg-white/10"
              >
                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                href="#" 
                className="flex items-center px-4 py-3 text-white/70 hover:bg-white/10"
              >
                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                My Group
              </Link>
            </li>
            <li>
              <Link 
                href="#" 
                className="flex items-center px-4 py-3 text-white/70 hover:bg-white/10"
              >
                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Group
              </Link>
            </li>
            <li>
              <Link 
                href="#" 
                className="flex items-center px-4 py-3 text-white/70 hover:bg-white/10"
              >
                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Join Group
              </Link>
            </li>
            <li>
              <Link 
                href="#" 
                className="flex items-center px-4 py-3 text-white/70 hover:bg-white/10"
              >
                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Messages
                <span className="ml-auto bg-white text-primary text-xs font-bold px-2 py-0.5 rounded-full">1</span>
              </Link>
            </li>
            <li>
              <Link 
                href="#" 
                className="flex items-center px-4 py-3 text-white/70 hover:bg-white/10"
              >
                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help & Support
              </Link>
            </li>
            <li>
              <Link 
                href="/auth/profile-setup" 
                className="flex items-center px-4 py-3 text-white/70 hover:bg-white/10"
              >
                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={logout}
            className="flex items-center text-white/70 hover:text-white w-full"
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h1 className="text-lg font-medium">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button className="text-gray-500" aria-label="Notifications">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {userData?.profile_image ? (
                  <Image 
                    src={userData.profile_image} 
                    alt={userData.full_name || 'User'} 
                    width={32} 
                    height={32} 
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {firstName.charAt(0)}
                  </span>
                )}
              </div>
              <span className="ml-2 text-sm font-medium">
                {loading ? 'Loading...' : `Mercy Oyekunle`}
              </span>
              <svg className="w-4 h-4 ml-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Welcome, {loading ? 'User' : firstName}
            </h2>
            <p className="text-gray-500 text-sm">Here's an overview of your savings</p>
          </div>

          <div className="flex justify-end mb-6 space-x-3">
            <Button 
              variant="outline" 
              className="bg-white"
            >
              Join a Group
            </Button>
            <Button>
              Create a Group
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="text-gray-500 text-sm mb-2">Your savings</h3>
              <div className="text-2xl font-bold">₦0</div>
              <div className="text-gray-500 text-xs mt-1">Total saved across all groups</div>
              <div className="mt-4">
                <div className="text-xs font-medium text-gray-500 mb-1">Progress</div>
                <div className="relative w-full h-1.5 bg-gray-100 rounded-full">
                  <div className="absolute left-0 top-0 h-full bg-primary rounded-full" style={{ width: '0%' }}></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>0%</span>
                  <span>Goal: ₦500,000.00</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="text-gray-500 text-sm mb-2">Next Contribution</h3>
              <div className="text-xl font-medium">No upcoming contribution</div>
              <div className="text-gray-500 text-xs mt-2">Create a group or join an existing one to start saving together</div>
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="text-gray-500 text-sm mb-2">Next Payout</h3>
              <div className="text-xl font-medium">No payout yet!</div>
              <div className="text-gray-500 text-xs mt-2">You'll see your payout date here after joining a group</div>
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="text-gray-500 text-sm mb-2">Payout Number</h3>
              <div className="text-xl font-medium">Not assigned yet!</div>
              <div className="text-gray-500 text-xs mt-2">Join or create a group to get a payout number</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Groups Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">My Groups</h3>
                  <div className="flex">
                    <button className="px-3 py-1 text-sm border-b-2 border-primary">
                      My Groups
                    </button>
                    <button className="px-3 py-1 text-sm text-gray-500">
                      Discover Groups
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <div className="text-gray-700 mb-4">You don't have any group yet</div>
                <div className="text-sm text-gray-500 mb-6">Create a group or join an existing one to start saving together</div>
                <div className="flex space-x-3">
                  <Button variant="outline" className="text-sm">
                    Join with Code
                  </Button>
                  <Button className="text-sm">
                    Create a Group
                  </Button>
                </div>
              </div>
            </div>

            {/* Savings & Activity Section */}
            <div className="grid grid-rows-2 gap-6">
              <div className="bg-white rounded-lg shadow">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-medium">Savings Target</h3>
                </div>
                <div className="p-5">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mr-3">
                      M
                    </div>
                    <div>
                      <div className="text-sm font-medium">Money Target</div>
                      <div className="text-xs text-gray-500">₦500,000</div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>0% complete</span>
                    <span>₦500,000 to go</span>
                  </div>
                  <div className="relative w-full h-2 bg-gray-100 rounded-full">
                    <div className="absolute left-0 top-0 h-full bg-primary rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <button className="mt-4 text-primary text-sm font-medium">
                    Update Goal
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-medium">AI Insights</h3>
                </div>
                <div className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="text-orange-600 mb-3">No tips yet</div>
                  <div className="text-sm text-gray-500">
                    Join or create a savings group to start getting smart tips that help you stay on track
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-6 bg-white rounded-lg shadow">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-medium">Recent Activity</h3>
            </div>
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95a1 1 0 001.715 1.029zM6 12a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7 4a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2zM7 6a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-gray-700 mb-2">No activity to show</div>
              <div className="text-sm text-gray-500">
                You don't have any transactions and updates. Create a group or join an existing one to start saving together
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 