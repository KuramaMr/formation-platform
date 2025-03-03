/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  eslint: {
    // Désactive ESLint pendant le build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Optionnellement, désactive aussi les vérifications TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
