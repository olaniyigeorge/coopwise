import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '@/styles/markdown.css'
import { AppWrapper } from '@/components/app-wrapper'
import { Toaster } from "@/components/ui/toaster"
import { PingBackend } from '@/components/keep_alive'

// Load Inter font with subset optimization
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, 
  userScalable: false
}

export const metadata: Metadata = {
  title: 'CoopWise | Smart Cooperative Savings Groups Management Platform',
  description: 'Join CoopWise to create, manage, and grow your savings groups. Track contributions, schedule payouts, and build wealth together with our secure cooperative management platform.',
  keywords: ['ajo', 'cooperative savings', 'savings groups', 'charas', 'susu', 'tontine', 'rotating savings', 'financial cooperation', 'group savings', 'community savings', 'money management', 'cooperative finance'],
  authors: [{ name: 'CoopWise Team' }],
  creator: 'CoopWise',
  publisher: 'CoopWise',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://coopwise-seven.vercel.app'), // coopwise.com
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://coopwise-seven.vercel.app', // coopwise.com
    title: 'CoopWise | Smart Cooperative Savings Groups Management Platform',
    description: 'Join CoopWise to create, manage, and grow your savings groups. Track contributions, schedule payouts, and build wealth together with our secure cooperative management platform.',
    siteName: 'CoopWise',
    images: [
      {
        url: '/assets/images/OG Image_coopwise-1.png',
        width: 1200,
        height: 630,
        alt: 'CoopWise - Save Money Together, The Smarter Way',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoopWise | Smart Cooperative Savings Groups Management Platform',
    description: 'Join CoopWise to create, manage, and grow your savings groups. Track contributions, schedule payouts, and build wealth together.',
    images: ['/assets/images/OG Image_coopwise-1.png'],
    creator: '@coopwise',
  },
  icons: {
    icon: '/images/coopwise-logo.svg',
    shortcut: '/images/coopwise-logo.svg',
    apple: '/images/coopwise-logo.svg',
  },
  manifest: '/manifest.json',
  verification: {
    google: 'your-google-verification-code-here',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans" suppressHydrationWarning>
        <AppWrapper>{children}</AppWrapper>
        <Toaster />
        <PingBackend />
      </body>
    </html>
  )
}
