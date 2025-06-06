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
      },
      { // placeholder
        protocol: "https",
        hostname: "avatar.iran.liara.run"
      }
    ],
    path: "/",
  },
};

export default nextConfig;