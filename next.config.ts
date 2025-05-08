/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/Data-Scrub',
  assetPrefix: '/Data-Scrub/',
  trailingSlash: true,
}

export default nextConfig;
