"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between" suppressHydrationWarning>
      <Link href="/" className="flex items-center space-x-3">
        <Image
          src="/images/coopwise-logo.svg"
          alt="CoopWise Logo"
          width={32}
          height={32}
          className="w-8 h-8"
        />
        <span className="text-xl font-semibold text-primary">CoopWise</span>
      </Link>
      
      <div className="hidden md:flex items-center space-x-8" suppressHydrationWarning>
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
      
      {/* Desktop auth buttons */}
      <div className="hidden md:flex items-center space-x-2" suppressHydrationWarning>
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

      {/* Mobile hamburger menu */}
      <div className="md:hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-gray-700"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white pt-20 px-6 md:hidden">
          <div className="absolute top-4 right-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-700"
            >
              <X size={24} />
            </Button>
          </div>
          <div className="flex flex-col space-y-6">
            <Link 
              href="/" 
              className={`text-lg font-medium py-2 ${pathname === '/' ? 'text-primary' : 'text-gray-700'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/how-it-works" 
              className={`text-lg font-medium py-2 ${pathname === '/how-it-works' ? 'text-primary' : 'text-gray-700'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link 
              href="/contact" 
              className={`text-lg font-medium py-2 ${pathname === '/contact' ? 'text-primary' : 'text-gray-700'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Contact Us
            </Link>
            <div className="pt-4 border-t border-gray-200">
              <Link 
                href="/auth/login" 
                className="block text-lg font-medium py-2 text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signup" 
                className="block text-lg font-medium py-2 text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
} 