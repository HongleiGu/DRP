import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com"
      },
      { // placeholder
        protocol: "https",
        hostname: "picsum.photos"
      }
    ],
    path: "/",
  },
};

export default nextConfig;