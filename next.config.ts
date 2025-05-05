
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
   experimental: {
    serverActions: {
        allowedOrigins: ['localhost:9002'], // Adjust origin if needed for deployment
        bodySizeLimit: '2mb', // Increase if handling large uploads via actions
    },
  },
};

export default nextConfig;
