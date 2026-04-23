/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Capacitor mobile builds
  ...(process.env.MOBILE_BUILD === 'true' && {
    output: 'export',
    images: {
      unoptimized: true,
    },
  }),
};

export default nextConfig;
