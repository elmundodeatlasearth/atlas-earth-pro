// src/__tests__/permissions.test.ts
// Tests unitarios para las reglas de permisos Free / PRO / ULTRA
import { computePermissions } from "@/hooks/usePermissions";

describe("computePermissions — plan FREE", () => {
  const p = computePermissions(false, false);

  it("puede ver SOLO la renta diaria", () => {
    expect(p.canViewRentDaily).toBe(true);
  });

  it("no puede ver renta completa (semanal/mensual/anual)", () => {
    expect(p.canViewFullRent).toBe(false);
  });

  it("no tiene simulador, auditoría, comparativa, historial ni nube", () => {
    expect(p.canUseSimulator).toBe(false);
    expect(p.canViewFullAudit).toBe(false);
    expect(p.canCompareTiers).toBe(false);
    expect(p.canHistoryChart).toBe(false);
    expect(p.canSaveHistory).toBe(false);
    expect(p.canCloudProfiles).toBe(false);
    expect(p.canUseAI).toBe(false);
  });

  it("no tiene features ULTRA", () => {
    expect(p.canUseECOptimizerUltra).toBe(false);
    expect(p.canMultiCountryUltra).toBe(false);
    expect(p.canMultiCountry).toBe(false);
  });

  it("recibe 0 créditos IA/mes", () => {
    expect(p.aiCreditsPerMonth).toBe(0);
  });
});

describe("computePermissions — plan PRO", () => {
  const p = computePermissions(true, false);

  it("puede ver renta diaria y completa", () => {
    expect(p.canViewRentDaily).toBe(true);
    expect(p.canViewFullRent).toBe(true);
    expect(p.canViewMetaProgreso).toBe(true);
  });

  it("tiene simulador, auditoría, comparativa, historial y nube", () => {
    expect(p.canUseSimulator).toBe(true);
    expect(p.canViewFullAudit).toBe(true);
    expect(p.canCompareTiers).toBe(true);
    expect(p.canHistoryChart).toBe(true);
    expect(p.canSaveHistory).toBe(true);
    expect(p.canCloudProfiles).toBe(true);
    expect(p.canViewEstrategia).toBe(true);
    expect(p.canExportCSV).toBe(true);
  });

  it("NO tiene features ULTRA-exclusivas", () => {
    expect(p.canUseECOptimizerUltra).toBe(false);
    expect(p.canMultiCountryUltra).toBe(false);
    expect(p.canMultiCountry).toBe(false); // multi-país es ULTRA
  });

  it("recibe 5 créditos IA/mes", () => {
    expect(p.canUseAI).toBe(true);
    expect(p.aiCreditsPerMonth).toBe(5);
  });
});

describe("computePermissions — plan ULTRA", () => {
  const p = computePermissions(false, true);

  it("tiene TODO lo de PRO", () => {
    expect(p.canViewFullRent).toBe(true);
    expect(p.canUseSimulator).toBe(true);
    expect(p.canViewFullAudit).toBe(true);
    expect(p.canCompareTiers).toBe(true);
    expect(p.canHistoryChart).toBe(true);
    expect(p.canSaveHistory).toBe(true);
    expect(p.canCloudProfiles).toBe(true);
  });

  it("tiene features ULTRA-exclusivas", () => {
    expect(p.canUseECOptimizerUltra).toBe(true);
    expect(p.canMultiCountryUltra).toBe(true);
    expect(p.canMultiCountry).toBe(true);
  });

  it("recibe 50 créditos IA/mes", () => {
    expect(p.canUseAI).toBe(true);
    expect(p.aiCreditsPerMonth).toBe(50);
  });
});

describe("computePermissions — plan PRO+ULTRA (combo)", () => {
  const p = computePermissions(true, true);

  it("tiene todo habilitado", () => {
    expect(p.canViewFullRent).toBe(true);
    expect(p.canUseECOptimizerUltra).toBe(true);
    expect(p.canMultiCountryUltra).toBe(true);
    expect(p.aiCreditsPerMonth).toBe(50); // ULTRA manda
  });
});
