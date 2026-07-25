import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deshabilitar standalone output para evitar conflictos con Turbopack
  // output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
};

export default nextConfig;
