"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname();
  
  return (
    <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <Link href="/" className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-primary font-bold text-xs">CW</span>
        </div>
        <span className="text-xl font-semibold text-primary">CoopWise</span>
      </Link>
      
      <div className="hidden md:flex items-center space-x-8">
        <Link 
          href="/" 
          className={`text-sm font-medium relative py-1 
            ${pathname === '/' ? 'text-primary' : 'text-gray-700 hover:text-primary'}
            after:content-[''] after:absolute after:bottom-0 after:left-0 
            after:h-0.5 after:bg-primary after:transition-all after:duration-300 after:ease-in-out
            ${pathname === '/' ? 'after:w-full' : 'after:w-0 hover:after:w-full'}
          `}
        >
          Home
        </Link>
        <Link 
          href="/how-it-works" 
          className={`text-sm font-medium relative py-1 
            ${pathname === '/how-it-works' ? 'text-primary' : 'text-gray-700 hover:text-primary'}
            after:content-[''] after:absolute after:bottom-0 after:left-0 
            after:h-0.5 after:bg-primary after:transition-all after:duration-300 after:ease-in-out
            ${pathname === '/how-it-works' ? 'after:w-full' : 'after:w-0 hover:after:w-full'}
          `}
        >
          How It Works
        </Link>
        <Link 
          href="/contact" 
          className={`text-sm font-medium relative py-1 
            ${pathname === '/contact' ? 'text-primary' : 'text-gray-700 hover:text-primary'}
            after:content-[''] after:absolute after:bottom-0 after:left-0 
            after:h-0.5 after:bg-primary after:transition-all after:duration-300 after:ease-in-out
            ${pathname === '/contact' ? 'after:w-full' : 'after:w-0 hover:after:w-full'}
          `}
        >
          Contact Us
        </Link>
      </div>
      
      <div className="flex items-center space-x-2">
        <Link href="/auth/login">
          <Button 
            variant="outline" 
            className="text-primary border-primary hover:bg-primary hover:text-white transition-colors"
          >
            Sign In
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button className="bg-primary hover:bg-primary/90 text-white">
            Sign Up
          </Button>
        </Link>
      </div>
    </nav>
  )
} 