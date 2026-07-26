// src/components/DynamicBackground.tsx
// Client component wrapper for lazy-loaded HoneycombBackground
"use client";
import dynamic from "next/dynamic";

const HoneycombBackground = dynamic(
  () => import("@/components/HoneycombBackground"),
  { ssr: false }
);

export default function DynamicBackground() {
  return <HoneycombBackground />;
}
