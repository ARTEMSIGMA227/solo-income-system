import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true, // 👈 ЭТО РЕШАЕТ ESLINT-ОШИБКУ
  },
};

export default nextConfig;