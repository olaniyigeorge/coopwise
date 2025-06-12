import React from 'react'
// import LoginForm from '@/components/login-form'
import LoginForm from '@/components/auth/login-form'


export default function LoginPage() {
  return (
    <div className="min-h-screen auth_bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}