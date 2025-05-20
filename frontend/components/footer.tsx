"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-primary text-white py-6 md:py-4">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center flex-col md:flex-row text-center md:text-left">
            <div className="flex items-center mb-2 md:mb-0">
              <div className="w-5 h-5 rounded-full bg-white mr-2 flex items-center justify-center">
                <span className="text-primary font-bold text-[10px]">CW</span>
              </div>
              <span className="text-sm font-medium">CoopWise</span>
            </div>
            <span className="text-xs md:ml-2 text-white/80">© {new Date().getFullYear()} CoopWise. All rights reserved.</span>
          </div>
          
          <div className="flex space-x-6 text-xs">
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/support" className="hover:underline">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  )
} 