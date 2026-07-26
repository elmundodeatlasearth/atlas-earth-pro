// src/components/HistorialChart.tsx
// Chart.js chart with dark theme, multi-line (AB + USD), tooltips, animations
"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartConfiguration } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export interface HistorialEntry {
  fecha: string;
  ab_generado: number;
  usd_generado: number;
  diamantes_obtenidos: number;
}

interface Props {
  data: HistorialEntry[];
}

export default function HistorialChart({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    // Destroy previous chart
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const fechas = data.map((d) => {
      const parts = d.fecha.split("-");
      return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.fecha;
    });

    // Check if we have meaningful AB data (not all zero)
    const hasAb = data.some(d => d.ab_generado > 0);

    const config: ChartConfiguration = {
      type: "line",
      data: {
        labels: fechas,
        datasets: [
          {
            label: "USD Generados",
            data: data.map(d => Number(d.usd_generado.toFixed(6))),
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: "#10b981",
            pointBorderColor: "#fff",
            pointBorderWidth: 1,
            borderWidth: 2,
            yAxisID: "y",
          },
          ...(hasAb ? [{
            label: "AB Generados",
            data: data.map(d => d.ab_generado),
            borderColor: "#8b5cf6",
            backgroundColor: "rgba(139, 92, 246, 0.08)",
            fill: true,
            tension: 0.35,
            pointRadius: 2,
            pointHoverRadius: 5,
            pointBackgroundColor: "#8b5cf6",
            pointBorderColor: "#fff",
            pointBorderWidth: 1,
            borderWidth: 2,
            yAxisID: "y1",
          }] as any[] : []),
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            labels: {
              color: "#9ca3af",
              font: { family: "Inter, sans-serif", size: 11 },
              usePointStyle: true,
              padding: 16,
            },
          },
          tooltip: {
            backgroundColor: "rgba(13, 13, 13, 0.95)",
            titleColor: "#e5e7eb",
            bodyColor: "#9ca3af",
            borderColor: "rgba(255,255,255,0.08)",
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            titleFont: { family: "Inter, sans-serif", size: 12, weight: "bold" as any },
            bodyFont: { family: "Inter, sans-serif", size: 11 },
            displayColors: true,
            boxPadding: 6,
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: {
              color: "#666",
              font: { family: "Inter, sans-serif", size: 10 },
              maxTicksLimit: 10,
            },
          },
          y: {
            position: "left",
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: {
              color: "#666",
              font: { family: "Inter, sans-serif", size: 10 },
              callback: (val: any) => "$" + Number(val).toFixed(4),
            },
          },
          ...(hasAb ? {
            y1: {
              position: "right",
              grid: { drawOnChartArea: false },
              ticks: {
                color: "#666",
                font: { family: "Inter, sans-serif", size: 10 },
                callback: (val: any) => Number(val).toFixed(0) + " AB",
              },
            },
          } : {}),
        },
      },
    };

    chartRef.current = new ChartJS(ctx, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-500">
        Aún no hay datos de historial. ¡Registra tu primer día arriba!
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-full" style={{ maxHeight: "280px", minHeight: "200px" }} />
    </div>
  );
}
