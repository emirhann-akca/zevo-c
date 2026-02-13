/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  experimental: {
    optimizeCss: true,
    serverComponentsExternalPackages: ['@google-cloud/vertexai'],
  },
}

module.exports = nextConfig
