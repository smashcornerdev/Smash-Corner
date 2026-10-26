import type { NextConfig } from "next";

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
  experimental: {
    // proof-of-payment uploads (5 MB max) go through server actions
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
