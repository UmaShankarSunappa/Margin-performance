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
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // The `allowedDevOrigins` option is in preview and is only available in `next dev`.
  allowedDevOrigins: [
    'https://*.cloudworkstations.dev',
  ],
};

export default nextConfig;
