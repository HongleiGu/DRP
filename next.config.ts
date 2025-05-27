import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      // For latest Clerk versions using CDN:
      {
        protocol: 'https',
        hostname: '*.clerkusercontent.com',
      }
    ],
  },
};


export default nextConfig;
