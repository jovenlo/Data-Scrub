/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/Data-Scrub',
  assetPrefix: '/Data-Scrub/',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  experimental: {},
  // Disable server features for static export
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig;
