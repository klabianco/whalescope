/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'export' for Vercel deployment with API routes
  // output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
}
module.exports = nextConfig
