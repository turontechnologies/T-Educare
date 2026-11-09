import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app deliberately has its own pnpm-lock.yaml (no shared workspace
  // with frontend/, per repo CLAUDE.md) — without this, Turbopack infers the
  // monorepo root from the nearest ancestor lockfile instead.
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    // Brand assets in public/ (logo marks, illustrations) are served as SVG.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
