import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "55mb",
    },
  },
  outputFileTracingIncludes: {
    "/api/tutorial-assets/\\[\\.\\.\\.path\\]": ["./protected/tutorials/**/*"],
  },
};

export default nextConfig;
