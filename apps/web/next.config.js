const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: false,
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  images: {
    domains: [
      'localhost',
      'example.com', 
      'campuspe-resumes-cdn-v2.b-cdn.net',  // BunnyCDN for college logos and documents
      'images.unsplash.com'  // Unsplash images
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL, // Add your API URL here
    WHATSAPP_API_URL: process.env.WHATSAPP_API_URL, // WhatsApp API URL
  },
  // Optimize for Azure App Service - using standard build instead of standalone
  // output: 'standalone',  // Commented out as it might cause issues in monorepo
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true,
      },
    ];
  },
  // Azure App Service compatibility
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
        ],
      },
    ];
  },
};

module.exports = nextConfig;
