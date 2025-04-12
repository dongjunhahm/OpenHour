// Set NODE_TLS_REJECT_UNAUTHORIZED directly for SSLs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Disable experimental dynamicIO to avoid crypto module issues
    dynamicIO: false
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      console.log("Configuring server with SSL certificate fix");
      // Apply SSL settings at build time
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }
    return config;
  },
};

export default nextConfig;
