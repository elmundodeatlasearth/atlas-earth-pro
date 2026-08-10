// src/utils/tasasCambio.ts
// Tasas de cambio EN VIVO con cache local de 24h (open.er-api.com gratis).
// Fallback: tasas estáticas de atlasMath si la API falla o no hay internet.
//
// Uso:
//   import { tasaEnVivoPara } from "@/utils/tasasCambio";
//   const tasa = await tasaEnVivoPara("MXN");  // número (fallback incluido)

import { FALLBACK_RATES } from "./atlasMath";

const API_URL = "https://open.er-api.com/v6/latest/USD";
const CACHE_KEY = "ae_tasas_cambio_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export interface TasasCache {
  fecha: string;          // ISO de cuando se obtuvo
  tasas: Record<string, number>;
}

/** Lee el cache; devuelve null si no existe o expiró */
export function leerCacheTasas(): TasasCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TasasCache;
    if (!parsed?.tasas || typeof parsed.tasas !== "object") return null;
    const edad = Date.now() - new Date(parsed.fecha).getTime();
    if (Number.isNaN(edad) || edad > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Guarda el cache de tasas */
export function guardarCacheTasas(tasas: Record<string, number>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ fecha: new Date().toISOString(), tasas }));
  } catch { /* localStorage no disponible */ }
}

/** Construye registros de tasa para todas las monedas que usa la app */
export function combinarTasas(api: Record<string, number> | null): Record<string, number> {
  const result: Record<string, number> = { ...FALLBACK_RATES };
  if (api) {
    for (const key of Object.keys(result)) {
      const v = api[key];
      if (typeof v === "number" && v > 0) result[key] = v;
    }
  }
  return result;
}

/**
 * Obtiene la tasa en vivo para una moneda.
 * 1) Busca cache fresco
 * 2) Si no, llama a la API (una sola vez por sesión)
 * 3) Si todo falla, usa la tasa estática (fallback)
 */
let promesaFetch: Promise<Record<string, number>> | null = null;

export async function obtenerTasasEnVivo(): Promise<Record<string, number>> {
  // Cache fresco → devolverlo
  const cache = leerCacheTasas();
  if (cache) return cache.tasas;

  // Evitar fetches paralelos duplicados
  if (!promesaFetch) {
    promesaFetch = (async () => {
      try {
        const res = await fetch(API_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`API responded ${res.status}`);
        const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
        if (data?.result !== "success" || !data.rates) throw new Error("API sin rates");
        const tasas = combinarTasas(data.rates);
        guardarCacheTasas(tasas);
        return tasas;
      } catch (e) {
        console.warn("[tasasCambio] API falló, usando fallback estático:", String(e));
        return { ...FALLBACK_RATES };
      } finally {
        // Permitir reintentar después de un rato (reset de la promesa)
        setTimeout(() => { promesaFetch = null; }, CACHE_TTL_MS);
      }
    })();
  }
  return promesaFetch;
}

/** Helper: tasa en vivo para una moneda (con fallback inmediato) */
export async function tasaEnVivoPara(moneda: string): Promise<number> {
  const tasas = await obtenerTasasEnVivo();
  return tasas[moneda] || FALLBACK_RATES[moneda] || 1.0;
}
