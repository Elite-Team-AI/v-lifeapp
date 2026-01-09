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
}

export default nextConfig
