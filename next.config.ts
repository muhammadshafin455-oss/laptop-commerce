import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Product photos are uploaded through a Server Action, and the default
      // request cap is 1MB. 4.5mb is Vercel's hard limit for a serverless
      // request body; MAX_IMAGE_BYTES in src/lib/images.ts sits just under it
      // so oversized files get a real message instead of a platform 413.
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
