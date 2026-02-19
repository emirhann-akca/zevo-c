/** @type {import('next').NextConfig} */
const nextConfig = {
  // ===== IMAGE OPTIMIZATION =====
  images: {
    formats: ['image/avif', 'image/webp'], // Modern format priority
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Responsive breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Icon/thumbnail sizes
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },

  // ===== COMPILER OPTIMIZATIONS =====
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // ===== EXPERIMENTAL FEATURES =====
  experimental: {
    optimizeCss: true,
    serverComponentsExternalPackages: ['@google-cloud/vertexai'],
    optimizePackageImports: ['lucide-react', 'framer-motion'], // Tree-shake these packages
  },

  // ===== COMPRESSION =====
  compress: true,

  // ===== POWERED BY HEADER =====
  poweredByHeader: false,

  // ===== STRICT MODE =====
  reactStrictMode: true,

  // ===== BUNDLE ANALYSIS SUPPORT =====
  // Run: ANALYZE=true npm run build
  webpack: (config, { isServer }) => {
    // Optimize GSAP - only include what we use
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
      }
    }
    return config
  },

  // ===== SECURITY + CACHING HEADERS =====
  async headers() {
    return [
      // Static assets - aggressive caching
      {
        source: '/team/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/hero-video.mp4',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // All routes - security headers
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob:",
              "connect-src 'self' https://us-central1-aiplatform.googleapis.com",
              "frame-src 'self' https://www.youtube.com https://youtube.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        ],
      },
    ];
  },
}
module.exports = nextConfig
