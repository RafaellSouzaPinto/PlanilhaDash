/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
    // Treat these Node.js-only packages as server-side externals
    // so webpack never tries to bundle them for client/edge
    serverComponentsExternalPackages: [
      "mysql2",
      "bcrypt",
      "lucia",
      "@lucia-auth/adapter-drizzle",
      "drizzle-orm",
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // SheetJS (xlsx) and other Node.js modules must not be bundled for browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        net: false,
        tls: false,
        "node:diagnostics_channel": false,
      };
    }
    return config;
  },
};

export default nextConfig;
