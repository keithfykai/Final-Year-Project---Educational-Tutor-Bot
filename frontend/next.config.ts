import type { NextConfig } from "next";

const nextConfig: Partial<NextConfig> & {
  eslint?: {
    ignoreDuringBuilds?: boolean;
  };
} = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["images.unsplash.com", "flowbite.com"],
  }
};

export default nextConfig;