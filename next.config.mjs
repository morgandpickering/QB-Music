/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This project lives under a home directory that has its own lockfile; pin
  // the root so Next traces files from here rather than from C:\Users\Morgan.
  outputFileTracingRoot: import.meta.dirname,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Add the CDN / CMS host here once real photography is hosted remotely.
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
