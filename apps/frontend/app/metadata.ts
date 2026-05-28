import { Metadata } from 'next'
import { generateOpenGraphMetadata, generateTwitterMetadata } from '@/lib/og-helpers'

export const metadata: Metadata = {
  title: 'CoopWise | Save Money Together, The Smarter Way',
  description: 'Create or join a trusted savings group, contribute money, and let AI-Powered saving assistant guide you.',
  openGraph: generateOpenGraphMetadata({
    title: 'CoopWise | Save Money Together, The Smarter Way',
    description: 'Create or join a trusted savings group, contribute money, and let AI-Powered saving assistant guide you.',
    url: '/'
  }),
  twitter: generateTwitterMetadata({
    title: 'CoopWise | Save Money Together, The Smarter Way',
    description: 'Create or join a trusted savings group, contribute money, and let AI-Powered saving assistant guide you.'
  })
} 