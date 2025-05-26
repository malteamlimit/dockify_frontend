import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export',
  images: {
    // unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/static/**",
      },
    ],
  },
  eslint: {
    // ignoreDuringBuilds: true,
  },
  // assetPrefix: 'https://optimalte.de/dockify',
};


export default nextConfig;