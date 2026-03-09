import type { NextConfig } from "next";

const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',

  async rewrites() {
    if (!MEDIA_BASE) return [];
    return [
      {
        source: "/media/:path*",
        destination: `${MEDIA_BASE}/:path*`,
      },
    ];
  },
};

export default nextConfig;