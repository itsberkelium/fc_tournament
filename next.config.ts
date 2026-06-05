import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.DOCKER === "true" ? "standalone" : undefined,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
    ],
  },
};

export default nextConfig;
