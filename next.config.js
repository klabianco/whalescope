/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/whalescope',
  images: { unoptimized: true },
  reactStrictMode: true,
}
module.exports = nextConfig
