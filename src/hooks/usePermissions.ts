// src/hooks/usePermissions.ts
// Sistema centralizado de permisos por plan (Free / PRO / Ultra)
// FREE: solo ve renta diaria
// PRO: dashboard completo, simulador, auditoría, historial, perfiles nube, IA (5 créditos/mes)
// ULTRA: todo lo de PRO + optimizador EC, análisis ROI, multi-país, IA (50 créditos/mes)
"use client";
import { useMemo } from "react";

export interface Permissions {
  // ≡≡≡ FREE (todos) ≡≡≡
  canViewRentDaily: boolean;       // ← ÚNICA feature gratuita: ver renta diaria

  // ≡≡≡ PRO (isPro o isUltra) ≡≡≡
  canViewFullRent: boolean;        // Rentas semanal, mensual, anual
  canViewMetaProgreso: boolean;     // Barra de progreso hacia meta
  canUseSimulator: boolean;         // Simulador de inversión inmediata
  canUseECOptimizer: boolean;       // Optimizador de Explorer Club
  canUseROIAnalysis: boolean;       // Análisis de ROI
  canViewFullAudit: boolean;        // Auditoría completa (5 pasos)
  canCompareTiers: boolean;         // Comparativa de tiers
  canMultiCountry: boolean;         // Multi-país en comparativa
  canHistoryChart: boolean;         // Gráfico de historial
  canSaveHistory: boolean;          // Guardar historial en nube
  canCloudProfiles: boolean;        // Perfiles en nube
  canViewEstrategia: boolean;       // Veredicto de estrategia
  canExportCSV: boolean;            // Exportar CSV

  // ≡≡≡ ULTRA-exclusivo (solo isUltra) ≡≡≡
  canUseECOptimizerUltra: boolean;  // Optimizador EC detallado (ULTRA)
  canMultiCountryUltra: boolean;    // Comparativa multi-país completa (ULTRA)

  // ≡≡≡ IA ≡≡≡
  canUseAI: boolean;
  aiCreditsPerMonth: number; // 5 = PRO, 50 = Ultra
}

/**
 * Función pura de cálculo de permisos — extraída para poder testearla.
 * Regla de negocio central: qué puede ver/hacer cada plan.
 * Los administradores obtienen acceso total ilimitado a todas las herramientas.
 */
export function computePermissions(isPro: boolean, isUltra: boolean, isAdmin = false): Permissions {
  const isProOrAdmin = isAdmin || isPro;
  const isUltraOrAdmin = isAdmin || isUltra;

  return {
    // FREE — renta diaria
    canViewRentDaily: true,

    // PRO+ (PRO, Ultra o Admin)
    canViewFullRent: isProOrAdmin || isUltraOrAdmin,
    canViewMetaProgreso: isProOrAdmin || isUltraOrAdmin,
    canUseSimulator: isProOrAdmin || isUltraOrAdmin,
    canUseECOptimizer: isProOrAdmin || isUltraOrAdmin,
    canUseROIAnalysis: isProOrAdmin || isUltraOrAdmin,
    canViewFullAudit: isProOrAdmin || isUltraOrAdmin,
    canCompareTiers: isProOrAdmin || isUltraOrAdmin,
    canMultiCountry: isUltraOrAdmin,
    canHistoryChart: isProOrAdmin || isUltraOrAdmin,
    canSaveHistory: isProOrAdmin || isUltraOrAdmin,
    canCloudProfiles: isProOrAdmin || isUltraOrAdmin,
    canViewEstrategia: isProOrAdmin || isUltraOrAdmin,
    canExportCSV: isProOrAdmin || isUltraOrAdmin,

    // ULTRA-exclusivo
    canUseECOptimizerUltra: isUltraOrAdmin,
    canMultiCountryUltra: isUltraOrAdmin,

    // IA
    canUseAI: isProOrAdmin || isUltraOrAdmin,
    aiCreditsPerMonth: isAdmin ? 999 : isUltra ? 50 : isPro ? 5 : 0,
  };
}

export function usePermissions(isPro: boolean, isUltra: boolean, isAdmin = false): Permissions {
  return useMemo(() => computePermissions(isPro, isUltra, isAdmin), [isPro, isUltra, isAdmin]);
}
