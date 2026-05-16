import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // The /admin tool POSTs entire source video files to a route handler.
    // Default Server-Action body limit is 1 MB; this raises it across the app
    // so video uploads (typically 5-50 MB) don't get truncated locally.
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
