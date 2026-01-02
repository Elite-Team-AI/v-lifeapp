/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel optimizes builds automatically - standalone output not needed
  // Keep typescript ignoreBuildErrors for now (errors are fixed but keeping as safety)
  typescript: {
    ignoreBuildErrors: false, // Changed to false since we fixed all errors
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
