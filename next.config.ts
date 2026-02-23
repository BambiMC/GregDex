import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["fs", "path"],
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
