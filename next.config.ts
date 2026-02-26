import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reduce memory usage during build
  experimental: {
    optimizePackageImports: ["react", "react-dom"],
  },
  async rewrites() {
    return [
      {
        source: "/icons/items/:filename",
        destination: "/api/icons/items/:filename",
      },
    ];
  },
};

export default nextConfig;
