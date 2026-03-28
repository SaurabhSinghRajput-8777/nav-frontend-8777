/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Mapbox to fetch tiles
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.mapbox.com" },
    ],
  },
};

export default nextConfig;
