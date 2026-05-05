/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: process.env.NEXT_PUBLIC_SERVER_ACTIONS_ALLOWED_ORIGINS ? process.env.NEXT_PUBLIC_SERVER_ACTIONS_ALLOWED_ORIGINS.split(',') : ['localhost:3000', '127.0.0.1:3000'],
    },
  },
  transpilePackages: ['typeorm'],
  turbopack: {},
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Content-Security-Policy (CSP) - IMPORTANT: This needs to be carefully configured
          // to avoid breaking the application. Start with a more permissive policy and
          // tighten it after testing. For now, a basic example.
          // {
          //   key: 'Content-Security-Policy',
          //   value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';",
          // },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
