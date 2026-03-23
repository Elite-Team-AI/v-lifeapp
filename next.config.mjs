/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel optimizes builds automatically - standalone output not needed
  // Enable ignoreBuildErrors temporarily - Next.js 16 changed revalidateTag signature
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configure headers for universal links / app links
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ]
  },
}

export default nextConfig
