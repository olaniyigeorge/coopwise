"use client"

import React from 'react'
import NewPasswordForm from '@/components/new-password-form'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import Image from 'next/image'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-primary/10">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Create New <span className="text-brand-teal relative">
                Password
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
              Set a strong password to keep your account secure
            </p>
          </div>
          
          <div className="bg-white shadow-md rounded-lg">
            <NewPasswordForm />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
} 