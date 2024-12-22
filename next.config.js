/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'lh3.googleusercontent.com',     // For Google profile images
      'firebasestorage.googleapis.com' // For Firebase Storage
    ]
  }
}

module.exports = nextConfig
