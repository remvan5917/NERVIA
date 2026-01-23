/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable support for large file uploads
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

module.exports = nextConfig;
