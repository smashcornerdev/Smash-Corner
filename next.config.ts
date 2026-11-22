import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  // a second dev server (e.g. automated checks) must use its own cache folder, or it corrupts .next for the main one
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Removed pages (spec §2, v4.60) and alias routes
  async redirects() {
    return [
      { source: "/about", destination: "/", permanent: true },
      { source: "/pricing", destination: "/", permanent: true },
      { source: "/events", destination: "/programs#pe-events", permanent: true },
      { source: "/faq", destination: "/contact#faq-sec", permanent: true },
    ];
  },
  // dev only: testing on a phone through VS Code port forwarding (*.devtunnels.ms)
  allowedDevOrigins: isDev ? ["*.devtunnels.ms"] : undefined,
  experimental: {
    // proof-of-payment uploads (5 MB max) go through server actions.
    // allowedOrigins (dev only): VS Code port forwarding sends x-forwarded-host=<id>-3000.<region>.devtunnels.ms
    // but rewrites Origin to localhost:3000, which Next's CSRF check rejects as
    // "Invalid Server Actions request" (e.g. admin sign-out on a phone).
    serverActions: { bodySizeLimit: "6mb", allowedOrigins: isDev ? ["localhost:3000", "*.devtunnels.ms"] : undefined },
  },
};

export default nextConfig;
