import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Brand assets in public/ (logo marks, illustrations) are served as SVG.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
