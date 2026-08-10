// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

// Solo habilitar Sentry si hay un DSN REAL (no el placeholder de ejemplo).
// Con DSN vacío/placeholder Sentry se desactiva por completo: la app funciona
// sin Sentry y el bundle no incluye telemetría.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isPlaceholder =
  !dsn ||
  dsn.includes("@o0.ingest.sentry.io/0") ||
  dsn.includes("examplePublicKey") ||
  dsn.includes("tu-dsn");

if (dsn && !isPlaceholder) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === "production",
  });
}
