import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/uploads/**',
      },
    ],
  },
  // Optimize production builds
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header
  // Reduce bundle size in production
  swcMinify: true, // Use SWC minification (faster than Terser)
};

export default nextConfig;
