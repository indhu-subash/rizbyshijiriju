import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
<<<<<<< Updated upstream
=======
      { protocol: 'https', hostname: 'pub-522048b574af4e7aa4d991056322b29a.r2.dev' },
>>>>>>> Stashed changes
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

export default nextConfig;
