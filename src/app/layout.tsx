import type { Metadata } from "next";
import "./globals.css";
import DynamicBackground from "@/components/DynamicBackground";
import { ToastProvider } from "@/components/toast";

export const metadata: Metadata = {
  title: "Atlas Earth PRO — Calculadora Estratégica Definitiva",
  description:
    "Maximiza tus ganancias en Atlas Earth. Calculadora de rentas, simulador de inversiones, optimizador Explorer Club, análisis de ROI y estrategia con IA.",
  keywords:
    "Atlas Earth, calculadora, estrategia, parcelas, rentas, ganancias, ROI, Explorer Club, SRB, simulator",
  authors: [{ name: "El Mundo de Atlas Earth" }],
  openGraph: {
    title: "Atlas Earth PRO — Calculadora Estratégica",
    description:
      "La herramienta más avanzada para maximizar tus ganancias en Atlas Earth.",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atlas Earth PRO",
    description:
      "Calcula rentas, simula inversiones y obtén estrategias con IA.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://supabase.co" />
        <link rel="dns-prefetch" href="https://supabase.co" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#080808" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `
        }} />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased bg-[#0a0a0a] text-white relative">
        <DynamicBackground />
        <div className="relative z-10 flex-1 flex flex-col">
          <ToastProvider>
            {children}
          </ToastProvider>
        </div>
      </body>
    </html>
  );
}
