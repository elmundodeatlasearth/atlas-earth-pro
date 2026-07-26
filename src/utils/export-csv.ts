// src/utils/export-csv.ts
// Exportar historial a CSV con descarga automática

import type { HistorialEntry } from "@/components/HistorialChart";

export function exportHistorialCSV(data: HistorialEntry[]): void {
  if (data.length === 0) return;

  const headers = ["Fecha", "AB Generados", "USD Generados", "Diamantes Obtenidos"];
  const rows = data.map(d => [
    d.fecha,
    d.ab_generado.toString(),
    d.usd_generado.toFixed(6),
    d.diamantes_obtenidos.toString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(r => r.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `atlas-earth-historial-${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
