/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Vercel nebude kontrolovať ESLint chyby pri builde
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Vercel nebude kontrolovať TypeScript chyby pri builde
    ignoreBuildErrors: true,
  },
};

export default nextConfig;