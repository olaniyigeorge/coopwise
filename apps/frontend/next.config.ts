import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(self), payment=(self)",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,

  typescript: {
    // Pre-existing project setting: the dev loop relies on `next build`
    // surfacing issues through CI rather than blocking local builds.
    ignoreBuildErrors: true,
  },

  images: {
    // The app serves member uploads (KYC documents, avatars) from a few
    // different buckets/CDNs, so allow https sources rather than pinning
    // every host. SVG stays opt-in per <Image> for safety.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  experimental: {
    // Tree-shake the icon/date/animation barrels instead of pulling the
    // whole package into every route chunk.
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "framer-motion",
      "recharts",
    ],
  },

  compiler:
    process.env.NODE_ENV === "production"
      ? { removeConsole: { exclude: ["error", "warn"] } }
      : undefined,

  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://coopwise.onrender.com",

    NEXT_PUBLIC_WS_URL:
      process.env.NEXT_PUBLIC_WS_URL || "wss://coopwise.onrender.com",

    NEXT_PUBLIC_USE_MOCK_DATA:
      process.env.NEXT_PUBLIC_USE_MOCK_DATA || "false",
  },

  turbopack: {
    root: __dirname,
    resolveAlias: {
      "@react-native-async-storage/async-storage": "./empty-module.js",
      "pino-pretty": "./empty-module.js",
    },
  },

  webpack: (config, { dev }) => {
    if (dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@react-native-async-storage/async-storage": false,
        "pino-pretty": false,
      };
    }

    return config;
  },

  async headers() {
    return [
      // The service worker must never be served stale, or clients can get
      // stuck on an old cache forever.
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600" },
          { key: "Content-Type", value: "application/manifest+json" },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
