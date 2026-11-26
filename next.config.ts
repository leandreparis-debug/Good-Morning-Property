import type { NextConfig } from "next";
import { getEnv } from "./src/lib/env";

// Fail fast with a readable message if a variable is missing (dev, build and start).
getEnv();

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  headers() {
    return Promise.resolve([
      { source: "/:path*", headers: securityHeaders },
      {
        // Personal links: never leak the token (referrer, caches, search engines).
        source: "/l/:token*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ]);
  },
};

export default nextConfig;
