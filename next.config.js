/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable this to help with Server Components
  experimental: {
    serverComponents: false,
  },
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
}

module.exports = nextConfig;
