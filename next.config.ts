import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use webpack instead of turbopack for better memory control
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        sharp: "commonjs sharp",
      });
    }

    // Reduce memory usage
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: -10,
            chunks: "all",
          },
        },
      },
    };

    return config;
  },
  // Reduce memory usage during build
  experimental: {
    optimizePackageImports: ["react", "react-dom"],
  },
  // Force webpack usage
  turbopack: {},
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
