"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-4 pt-8 md:pt-12 pb-10 md:pb-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="space-y-4 md:space-y-6 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Save Money Together, the{" "}
            <span className="text-brand-teal relative">
              Smarter
              <span className="absolute -bottom-2 left-0 w-full">
                <Image
                  src="/assets/icons/Vector 85.svg"
                  alt="Underline"
                  width={120}
                  height={8}
                  className="w-full"
                />
              </span>
            </span>{" "}
            Way
          </h1>
          
          <p className="text-base md:text-lg text-gray-600">
            Create or join a savings group, contribute money, and let CoopWise guide you with smart reminders and helpful tips.
          </p>
          
          <div className="flex items-center space-x-4 pt-2 md:pt-4 justify-center md:justify-start">
            <Link href="/auth/signup">
              <Button className="bg-primary hover:bg-primary/90 text-white px-4 md:px-6">
                Get started
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button 
                variant="outline" 
                className="text-primary border-primary hover:bg-primary hover:text-white transition-colors"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mx-auto md:mx-0 w-full max-w-[320px] md:max-w-[500px]">
          <div className="relative w-full h-[280px] sm:h-[320px] md:h-[400px] rounded-xl overflow-hidden shadow-md">
            <Image 
              src="/images/hero-image.png" 
              alt="Happy CoopWise User" 
              fill
              sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 40vw"
              className="object-contain w-full h-full"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
} 