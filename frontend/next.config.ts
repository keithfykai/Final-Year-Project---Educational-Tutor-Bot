import type { NextConfig } from "next";

const nextConfig: Partial<NextConfig> = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "cassette.sphdigital.com.sg",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "flowbite.com",
      },
      {
        protocol: "https",
        hostname: "static1.straitstimes.com.sg",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://backend:8000/api/:path*", // Docker Compose backend service
      },
      {
        source: "/llm/:path*",
        destination: "http://backend:8000/llm/:path*", // Docker Compose backend service
      },
    ];
  },
};

export default nextConfig;
