// src/app/sitemap.ts
// Sitemap estático para export — lista las rutas públicas del sitio.
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://elmundodeatlasearth.github.io/atlas-earth-pro";
  return [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/admin`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.1,
    },
  ];
}
