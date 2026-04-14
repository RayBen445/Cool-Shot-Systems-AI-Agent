/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: process.env.BACKEND_URL 
          ? `${process.env.BACKEND_URL}/:path*` 
          : 'http://localhost:8000/:path*',
      },
    ]
  },
}

module.exports = nextConfig
