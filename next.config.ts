import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/atlas-earth-pro',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
