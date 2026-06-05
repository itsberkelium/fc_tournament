import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.DOCKER === "true" ? "standalone" : undefined,
};

export default nextConfig;
