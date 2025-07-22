import type { NextConfig } from "next";

const nextConfig: Partial<NextConfig> & {
  eslint?: {
    ignoreDuringBuilds?: boolean;
  };
} = {
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
