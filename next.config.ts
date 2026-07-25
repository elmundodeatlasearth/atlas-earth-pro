import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Config optimizada para Vercel (producción) y desarrollo local
  // NOTA: Sin output:'export' ni basePath para evitar conflictos con Supabase/Auth
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
