/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'export' for Vercel deployment with API routes
  // output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ]
  },
}
module.exports = nextConfig
