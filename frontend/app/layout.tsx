import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppWrapper } from '@/components/app-wrapper'

// Load Inter font with subset optimization
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'CoopWise | Smart Cooperative Savings Groups Management Platform',
  description: 'Join CoopWise to create, manage, and grow your savings groups. Track contributions, schedule payouts, and build wealth together with our secure cooperative management platform.',
  keywords: ['cooperative savings', 'savings groups', 'susu', 'tontine', 'rotating savings', 'financial cooperation', 'group savings', 'community savings', 'money management', 'cooperative finance'],
  authors: [{ name: 'CoopWise Team' }],
  creator: 'CoopWise',
  publisher: 'CoopWise',
  viewport: 'width=device-width, initial-scale=1',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://coopwise.com'),
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
    url: 'https://coopwise.com',
    title: 'CoopWise | Smart Cooperative Savings Groups Management Platform',
    description: 'Join CoopWise to create, manage, and grow your savings groups. Track contributions, schedule payouts, and build wealth together with our secure cooperative management platform.',
    siteName: 'CoopWise',
    images: [
      {
        url: '/images/coopwise-logo.svg',
        width: 1200,
        height: 630,
        alt: 'CoopWise - Cooperative Savings Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoopWise | Smart Cooperative Savings Groups Management Platform',
    description: 'Join CoopWise to create, manage, and grow your savings groups. Track contributions, schedule payouts, and build wealth together.',
    images: ['/images/coopwise-logo.svg'],
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
      </body>
    </html>
  )
}
