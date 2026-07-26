"use client";
import { useEffect } from "react";

export default function ErrorBoundary({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      console.error("[ErrorBoundary]", e.error);
    };
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);

  return <>{children}</>;
}
