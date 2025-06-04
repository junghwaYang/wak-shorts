import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['img.youtube.com', 'i.ytimg.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
};

export default nextConfig;
