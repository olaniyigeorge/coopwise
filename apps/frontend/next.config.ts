import type { NextConfig } from "next";
// import bundleAnalyzer from '@next/bundle-analyzer'

// const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })

const nextConfig: NextConfig = {
  reactCompiler: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://coopwise.onrender.com',
    NEXT_PUBLIC_USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA || 'false',
  },
  turbopack: {
    root: __dirname,
    resolveAlias: {
      '@react-native-async-storage/async-storage': './empty-module.js',
      'pino-pretty': './empty-module.js',
    },
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': false,
        'pino-pretty': false,
      }
    }
    return config
  },
}

export default nextConfig;