import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // AVIF first, then WebP. Cap the generated widths at the hero maximum
    // so a 1600px phone photo is not upscaled to the default 3840 slot.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920, 2400],
  },
};

export default nextConfig;
