// src/components/HistorialChart.tsx
"use client";

import { useEffect, useRef } from "react";

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

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const pad = { top: 20, bottom: 30, left: 50, right: 20 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    const fechas = data.map((d) => {
      const parts = d.fecha.split("-");
      return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.fecha;
    });
    const vals = data.map((d) => d.usd_generado);
    const maxVal = Math.max(...vals, 0.001);
    const minVal = Math.min(...vals, 0);
    const range = maxVal - minVal || 1;

    const xStep = chartW / Math.max(data.length - 1, 1);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      // Labels
      const val = maxVal - (range / 4) * i;
      ctx.fillStyle = "#666";
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`$${val.toFixed(4)}`, pad.left - 5, y + 4);
    }

    // Line
    ctx.beginPath();
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#10b98133";
    ctx.shadowBlur = 10;

    vals.forEach((v, i) => {
      const x = pad.left + i * xStep;
      const y = pad.top + chartH - ((v - minVal) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Fill gradient
    const lastX = pad.left + (vals.length - 1) * xStep;
    ctx.lineTo(lastX, pad.top + chartH);
    ctx.lineTo(pad.left, pad.top + chartH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, "rgba(16,185,129,0.2)");
    grad.addColorStop(1, "rgba(16,185,129,0.01)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Dots
    vals.forEach((v, i) => {
      const x = pad.left + i * xStep;
      const y = pad.top + chartH - ((v - minVal) / range) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // X labels
    fechas.forEach((f, i) => {
      if (i % Math.max(1, Math.floor(data.length / 8)) === 0) {
        const x = pad.left + i * xStep;
        ctx.fillStyle = "#666";
        ctx.font = "9px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(f, x, h - 5);
      }
    });
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-500">
        Aún no hay datos de historial. ¡Registra tu primer día arriba!
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={300}
      className="w-full h-full"
      style={{ maxHeight: "300px" }}
    />
  );
}
