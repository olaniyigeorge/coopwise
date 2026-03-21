"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { usePathname } from 'next/navigation'
import { Menu, X, Home, Info, Mail, LogIn, UserPlus, LogOut, ChevronDown, Calendar1Icon, User } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import useAuthStore from '@/lib/stores/auth-store'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { toast } from './ui/use-toast'
import { Avatar, AvatarFallback } from './ui/avatar'

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout }  = useAuthStore()
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


  

      // Helper functions for user display
  const getFirstName = (name: string) => name.split(' ')[0];
  const getFirstNameInitial = (name: string) => {
    const firstName = getFirstName(name);
    return firstName ? firstName[0].toUpperCase() : '';
  };
  
  // Generate avatar color
  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 55%)`;
  };
    // User display data
  const actualUserName = user?.full_name || '';
  const avatarColor = getAvatarColor(actualUserName);
  const firstNameInitial = getFirstNameInitial(actualUserName);
  const firstName = getFirstName(actualUserName);

    const isLandingPage = pathname === "/"
    
  //  Only show desktop nav if pathname is in navLinks
  // const showDesktopNav = navLinks.some(link => link.href === pathname)


  
  console.log('Navbar - isAuthenticated:', isAuthenticated);
  
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
          {isLandingPage && !isAuthenticated || !user? 
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
          :
            <div className="hidden md:flex items-center space-x-2" suppressHydrationWarning>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 hover:dark:bg-secondary active:bg-gray-100 rounded-full px-1 sm:px-2 py-1 transition-colors touch-manipulation">
                    {user?.profile_picture_url ? (
                      <div className="gradient-border object-contain rounded-full">
                        <Image
                          src={user.profile_picture_url}
                          alt={`${user.full_name}'s profile`}
                          style={{ backgroundColor: avatarColor }}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                        />
                      </div>
                    ) : (
                      <div className="gradient-border object-contain rounded-full">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback
                            style={{ backgroundColor: avatarColor }}
                            className="text-white"
                          >
                            {firstNameInitial}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    <div className="hidden sm:flex items-center gap-1 min-w-0">
                      <span className="text-sm font-medium text-primary truncate max-w-[100px]">
                        {firstName}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-1">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                    <Link href="/dashboard/" className="cursor-pointer py-2.5">
                      <Calendar1Icon className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="cursor-pointer py-2.5">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout()
                      toast({
                        title: "👋 Logged Out",
                        description: "We hate to see you leave. Come back soon! ❤️.",
                      })
                      window.location.href = "/auth/login";
                    }}
                    className="cursor-pointer py-2.5 text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }

          {/* Mobile hamburger menu */}
          <div className="md:hidden">
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

      {/* Mobile slide-in menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/30 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menu panel */}
            <motion.div 
              className="fixed top-0 right-0 bottom-0 z-50 bg-white w-[80%] max-w-sm shadow-xl md:hidden overflow-y-auto"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Image
                    src="/images/coopwise-logo.svg"
                    alt="CoopWise Logo"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                  <span className="text-lg font-semibold text-primary">CoopWise</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-700 rounded-full"
                >
                  <X size={24} />
                </Button>
              </div>
              
              <div className="px-4 py-6 flex flex-col space-y-6">
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
                    {isLandingPage || !isAuthenticated ? (
                      <>
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
                      </>
                    ) : (
                      <Link 
                        href="/dashboard" 
                        className="flex items-center space-x-3 p-3 rounded-xl text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Home size={18} />
                        <span className="font-medium">Dashboard</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Add padding to the page for fixed navbar */}
      <div className="h-16 md:h-20"></div>
    </>
  )
} 