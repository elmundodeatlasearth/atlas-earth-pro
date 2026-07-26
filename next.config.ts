import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Config optimizada para Vercel (producción) y desarrollo local
  images: {
    unoptimized: true,
  },
  // Permitir que el service worker se registre correctamente
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
