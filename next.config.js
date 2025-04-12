// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Removed experimental options to avoid type errors

  // Instruct Next.js on how to handle specific imports
  webpack(config) {
    // Handle browser-only packages
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
    };

    return config;
  },
};

export default nextConfig;
