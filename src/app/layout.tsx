import type { Metadata } from "next";
import "./globals.css";

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
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased bg-[#0a0a0a] text-white">
        {children}
      </body>
    </html>
  );
}
