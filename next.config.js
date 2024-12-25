/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: [
      'cdn.brandfetch.io',
      'firebasestorage.googleapis.com',
    ],
  },
}

module.exports = nextConfig
