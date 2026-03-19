"use client"

import React from 'react'
import ResetPasswordCodeForm from '@/components/reset-password-code-form'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import Image from 'next/image'

export default function ResetPasswordCodePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-primary/10">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Verify Your <span className="text-brand-teal relative">
                Email
                <span className="absolute -bottom-1 left-0 w-full">
                  <Image
                    src="/assets/icons/Vector 85.svg"
                    alt="Underline"
                    width={120}
                    height={8}
                    className="w-full"
                  />
                </span>
              </span>
            </h1>
            <p className="text-gray-600">
              Enter the verification code sent to your email
            </p>
          </div>
          
          <div className="bg-white shadow-md rounded-lg">
            <ResetPasswordCodeForm />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
} 