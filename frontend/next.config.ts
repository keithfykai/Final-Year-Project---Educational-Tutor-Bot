import type { NextConfig } from "next";

const nextConfig: Partial<NextConfig> = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["images.unsplash.com", "flowbite.com"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://backend:8000/api/:path*", // Docker Compose backend service
      },
    ];
  },
};

export default nextConfig;
