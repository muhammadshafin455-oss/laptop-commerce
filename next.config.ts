import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Product photos are uploaded through a Server Action, and the default
      // request cap is 1MB. Kept in step with MAX_IMAGE_BYTES in
      // src/lib/images.ts, which rejects oversized files with a real message.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
