import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Mapbox to fetch tiles
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.mapbox.com" },
    ],
  },
};

export default nextConfig;
