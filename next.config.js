/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  // Optimize CSS and JS
  compiler: {
    // Strip only noisy console.log in prod; KEEP error/warn/info so server
    // diagnostics (e.g. the [contact] email logs) survive in Render logs.
    removeConsole:
      process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn', 'info'] } : false,
  },
  // Performance optimizations
  swcMinify: true,
  // Keep native/server-only packages out of the bundle (native .node binaries
  // and heavy server libs are required at runtime instead of webpack-bundled).
  experimental: {
    serverComponentsExternalPackages: ['@node-rs/argon2', 'mongoose'],
  },
}


module.exports = nextConfig
