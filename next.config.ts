import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizeCss: true,
  },
  // Production güvenlik ayarları
  ...(process.env.NODE_ENV === 'production' && {
    // Source map'leri production'da devre dışı bırak
    productionBrowserSourceMaps: false,
    // Compiler optimizations
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'], // Sadece error ve warn logları kalır
      },
    },
  }),
  // Security headers middleware'de yönetiliyor
  // Ancak Next.js'in kendi güvenlik ayarları
  poweredByHeader: false, // X-Powered-By header'ını kaldır
};

export default nextConfig;
