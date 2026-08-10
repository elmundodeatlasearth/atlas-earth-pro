// src/__tests__/tasasCambio.test.ts
import { FALLBACK_RATES } from "@/utils/atlasMath";
import {
  combinarTasas,
  leerCacheTasas,
  guardarCacheTasas,
} from "@/utils/tasasCambio";

describe("tasasCambio — utilidades puras", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("combinarTasas: usa la API si hay tasas válidas, fallback estático si no", () => {
    const combinadas = combinarTasas({ MXN: 18.5, USD: 1, GBP: 0.75 });
    expect(combinadas.MXN).toBe(18.5);
    expect(combinadas.GBP).toBe(0.75);
    // Monedas que la API no trajo → se conserva el fallback
    expect(combinadas.CAD).toBe(FALLBACK_RATES.CAD);
  });

  it("combinarTasas: descarta tasas inválidas (0, negativas, NaN)", () => {
    const combinadas = combinarTasas({ MXN: 0, GBP: -2, USD: 1 });
    expect(combinadas.MXN).toBe(FALLBACK_RATES.MXN);
    expect(combinadas.GBP).toBe(FALLBACK_RATES.GBP);
  });

  it("combinarTasas: API nula → solo fallback estático", () => {
    const combinadas = combinarTasas(null);
    expect(combinadas).toEqual(FALLBACK_RATES);
  });

  it("guardar/leer cache: roundtrip correcto", () => {
    guardarCacheTasas({ MXN: 18.0, USD: 1 });
    const cache = leerCacheTasas();
    expect(cache).not.toBeNull();
    expect(cache?.tasas.MXN).toBe(18.0);
  });

  it("leerCacheTasas: JSON corrupto → null sin lanzar", () => {
    localStorage.setItem("ae_tasas_cambio_v1", "{corrupto");
    expect(leerCacheTasas()).toBeNull();
  });

  it("leerCacheTasas: cache vacío → null", () => {
    expect(leerCacheTasas()).toBeNull();
  });
});
