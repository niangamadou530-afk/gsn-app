import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    cpus: 1
  },
  async rewrites() {
    return [
      {
        source: "/:path*/static/:subpath*",
        destination: "/_next/static/:subpath*",
      },
      {
        source: "/static/:subpath*",
        destination: "/_next/static/:subpath*",
      },
    ];
  },
};

export default nextConfig;
