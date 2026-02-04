import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Cloudflare Pages 兼容配置
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
