// src/app/robots.ts
// robots.txt generado estáticamente (export).
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
    sitemap: "https://elmundodeatlasearth.github.io/atlas-earth-pro/sitemap.xml",
  };
}
