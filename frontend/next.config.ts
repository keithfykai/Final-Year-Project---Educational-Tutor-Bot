import type { NextConfig } from "next";

const nextConfig: Partial<NextConfig> = {
  images: {
    domains: [
      "avatars.githubusercontent.com",
      "cassette.sphdigital.com.sg",
      "images.unsplash.com",
      "flowbite.com",
      "static1.straitstimes.com.sg",
    ],
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
