import type { Metadata, Viewport } from 'next'
import { preconnect } from 'react-dom'
import './globals.css'
import '@/styles/markdown.css'
import { AppWrapper } from '@/components/app-wrapper'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from "@/components/ui/toaster"
import { PwaProvider } from '@/components/pwa/pwa-provider'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F4EC' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1712' },
  ],
}

export const metadata: Metadata = {
  applicationName: 'CoopWise',
  title: {
    default: 'CoopWise | Smart Cooperative Savings Groups Management Platform',
    template: '%s | CoopWise',
  },
  description: 'Join CoopWise to create, manage, and grow your savings groups. Track contributions, schedule payouts, and build wealth together with our secure cooperative management platform.',
  keywords: ['ajo', 'cooperative savings', 'savings groups', 'tontine', 'chamas', 'esusu', 'rotating savings', 'financial cooperation', 'group savings', 'community savings', 'money management', 'cooperative finance'],
  authors: [{ name: 'Abeleje Olaniyi George' }],
  creator: 'CoopWise',
  publisher: 'CoopWise',
  formatDetection: { email: false, telephone: false },
  metadataBase: new URL('https://coopwise-one.vercel.app'),
  alternates: { canonical: '/' },
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
    url: 'https://coopwise-one.vercel.app',
    title: 'CoopWise | Smart Cooperative Savings Groups Management Platform',
    description: 'Join CoopWise to create, manage, and grow your savings groups.',
    siteName: 'CoopWise',
    images: [{ url: '/assets/images/OG Image_coopwise-1.png', width: 1200, height: 630, alt: 'CoopWise' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoopWise | Smart Cooperative Savings Groups Management Platform',
    description: 'Join CoopWise to create, manage, and grow your savings groups.',
    images: ['/assets/images/OG Image_coopwise-1.png'],
    creator: '@coopwise',
  },
  icons: {
    icon: "/icons/coopwise-logo.png",
    shortcut: "/icons/coopwise-logo.png",
    apple: "/icons/coopwise-logo.png",
  },
  appleWebApp: {
    capable: true,
    title: 'CoopWise',
    statusBarStyle: 'black-translucent',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // The Google Fonts stylesheet is the first render-blocking request on a
  // cold visit; warm the connections while the HTML streams.
  preconnect('https://fonts.googleapis.com')
  preconnect('https://fonts.gstatic.com', { crossOrigin: 'anonymous' })

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AppWrapper>{children}</AppWrapper>
          <PwaProvider />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
