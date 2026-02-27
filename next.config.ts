import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build optimization
  productionBrowserSourceMaps: false,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.firebasestorage.app',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Compression
  compress: true,

  // Security headers
  async headers() {
    return [
      {
        // Prevent CDN/browser from caching HTML pages (JS bundles have content hashes)
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
      {
        source: '/seller',
        destination: '/vendor/products',
        permanent: false,
      },
      {
        source: '/delivery',
        destination: '/delivery/orders',
        permanent: false,
      },
    ];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
};

export default nextConfig;

