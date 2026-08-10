// src/utils/persistencia.ts
// Utilidades puras de persistencia local — extraídas del hook para poder testearlas.
// Historial del bug caro: guardar/restaurar perfiles con datos incompletos o
// corruptos rompía la app. Estas funciones validan antes de aplicar.

export const MIN_KEYS_PERFIL = 5;

/**
 * Parsea un perfil guardado en localStorage.
 * Devuelve null si no existe, no es JSON válido, o tiene menos de `MIN_KEYS_PERFIL`
 * claves (protege contra datos corruptos/parciales).
 */
export function parsePerfilGuardado(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      Object.keys(parsed).length >= MIN_KEYS_PERFIL
    ) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Lee un campo tipado de un perfil guardado (valores unknown → tipo esperado).
 * Evita que `unknown` se propague al estado tipado de la app.
 */
export function campoPerfil<T>(p: Record<string, unknown> | null, key: string, fallback: T): T {
  if (!p || !(key in p)) return fallback;
  const v = p[key];
  if (v === undefined || v === null) return fallback;
  return v as T;
}

/**
 * Lee y parsea el perfil de un nombre desde localStorage.
 * Wrapper seguro: nunca lanza, devuelve null si no hay perfil válido.
 */
export function leerPerfilLocal(nombre: string): Record<string, unknown> | null {
  try {
    return parsePerfilGuardado(localStorage.getItem(`ae_profile_${nombre}`));
  } catch {
    return null; // localStorage no disponible (SSR/privacy mode)
  }
}

/**
 * Lee la lista de perfiles guardada en `ae_profiles`.
 * Devuelve ["Principal"] como fallback si no existe o está corrupta.
 */
export function leerListaPerfiles(): string[] {
  try {
    const raw = localStorage.getItem("ae_profiles");
    if (!raw) return ["Principal"];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(String);
    }
    return ["Principal"];
  } catch {
    return ["Principal"];
  }
}

/**
 * Fuerza la normalización de la tasa de SRB a 64 horas.
 * Es un valor FIJO del juego (Super Rent Boost estándar) — el usuario ya no
 * puede editarlo, y cualquier dato viejo debe migrar a 64.
 */
export function normalizarHorasSrb(_h: unknown): number {
  // El valor del parámetro se ignora a propósito: SRB es un valor FIJO del juego
  void _h;
  return 64; // fijo
}

/**
 * Lee el nombre del perfil activo; valida que exista en la lista.
 * Devuelve el primero de la lista si el activo no existe (datos corruptos).
 */
export function leerPerfilActivo(lista: string[]): string {
  try {
    const active = localStorage.getItem("ae_active_profile");
    if (active && lista.includes(active)) return active;
  } catch { /* ignore */ }
  return lista[0] || "Principal";
}
