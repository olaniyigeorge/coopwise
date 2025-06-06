"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { usePathname } from 'next/navigation'
import { Menu, X, Home, Info, Mail, LogIn, UserPlus } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-4 py-3 md:py-4 
          ${scrolled ? 'bg-white shadow-md' : 'bg-white/80 backdrop-blur-md'}
          max-w-6xl mx-auto`} 
        suppressHydrationWarning
      >
        <div className="flex items-center justify-between">
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

          {/* Mobile hamburger menu - visible only on medium and up screens */}
          <div className="md:hidden sm:block hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:bg-gray-100 rounded-full h-10 w-10"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom navigation bar - for small screens */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 sm:hidden">
        <div className="grid grid-cols-5 h-16">
          <Link 
            href="/"
            className={`flex flex-col items-center justify-center text-xs font-medium ${pathname === '/' ? 'text-primary' : 'text-gray-500'}`}
          >
            <Home size={20} className={pathname === '/' ? 'text-primary' : 'text-gray-500'} />
            <span className="mt-1">Home</span>
          </Link>

          <Link 
            href="/how-it-works"
            className={`flex flex-col items-center justify-center text-xs font-medium ${pathname === '/how-it-works' ? 'text-primary' : 'text-gray-500'}`}
          >
            <Info size={20} className={pathname === '/how-it-works' ? 'text-primary' : 'text-gray-500'} />
            <span className="mt-1">How It Works</span>
          </Link>

          <div className="flex items-center justify-center">
            <Button 
              variant="default" 
              size="icon" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-primary hover:bg-primary/90 text-white rounded-full h-12 w-12 shadow-lg"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>

          <Link 
            href="/contact"
            className={`flex flex-col items-center justify-center text-xs font-medium ${pathname === '/contact' ? 'text-primary' : 'text-gray-500'}`}
          >
            <Mail size={20} className={pathname === '/contact' ? 'text-primary' : 'text-gray-500'} />
            <span className="mt-1">Contact</span>
          </Link>

          <Link 
            href="/auth/login"
            className={`flex flex-col items-center justify-center text-xs font-medium ${pathname.includes('/auth/') ? 'text-primary' : 'text-gray-500'}`}
          >
            <LogIn size={20} className={pathname.includes('/auth/') ? 'text-primary' : 'text-gray-500'} />
            <span className="mt-1">Sign In</span>
          </Link>
        </div>
      </div>

      {/* Mobile slide-up menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl md:hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          >
            <div className="flex justify-center pt-3">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>
            
            <div className="px-6 py-8 flex flex-col space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="flex flex-col space-y-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Navigation</h3>
                <Link 
                  href="/" 
                  className={`flex items-center space-x-3 p-3 rounded-xl ${pathname === '/' ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home size={18} />
                  <span className="font-medium">Home</span>
                </Link>
                <Link 
                  href="/how-it-works" 
                  className={`flex items-center space-x-3 p-3 rounded-xl ${pathname === '/how-it-works' ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Info size={18} />
                  <span className="font-medium">How It Works</span>
                </Link>
                <Link 
                  href="/contact" 
                  className={`flex items-center space-x-3 p-3 rounded-xl ${pathname === '/contact' ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Mail size={18} />
                  <span className="font-medium">Contact Us</span>
                </Link>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Account</h3>
                <div className="flex flex-col space-y-1">
                  <Link 
                    href="/auth/login" 
                    className="flex items-center space-x-3 p-3 rounded-xl text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LogIn size={18} />
                    <span className="font-medium">Sign In</span>
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    className="flex items-center space-x-3 p-3 rounded-xl text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserPlus size={18} />
                    <span className="font-medium">Sign Up</span>
                  </Link>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 pb-4">
                <Button
                  variant="ghost"
                  className="w-full text-gray-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Close Menu
                </Button>
              </div>
            </div>
            
            {/* Extra padding for bottom nav */}
            <div className="h-16 sm:hidden"></div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add padding to the page for fixed navbar */}
      <div className="h-16 md:h-20"></div>
    </>
  )
} 