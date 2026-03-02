import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Required for sharp (native module) to work in Vercel serverless functions
  serverExternalPackages: ['sharp'],
  experimental: {
    serverActions: {
      bodySizeLimit: '4.5mb',
    },
  },
}

export default nextConfig
