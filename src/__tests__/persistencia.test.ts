// src/__tests__/persistencia.test.ts
// Tests para las utilidades de persistencia local (el bug más caro de la app)
import {
  parsePerfilGuardado,
  leerPerfilLocal,
  leerListaPerfiles,
  leerPerfilActivo,
  normalizarHorasSrb,
  campoPerfil,
  MIN_KEYS_PERFIL,
} from "@/utils/persistencia";

describe("parsePerfilGuardado", () => {
  it("devuelve null si la entrada es null", () => {
    expect(parsePerfilGuardado(null)).toBeNull();
  });

  it("devuelve null si es JSON inválido", () => {
    expect(parsePerfilGuardado("{not json")).toBeNull();
    expect(parsePerfilGuardado("undefined")).toBeNull();
  });

  it("devuelve null si es un arreglo", () => {
    expect(parsePerfilGuardado("[]")).toBeNull();
    expect(parsePerfilGuardado("[1,2,3]")).toBeNull();
  });

  it("devuelve null si tiene menos de MIN_KEYS_PERFIL claves", () => {
    expect(parsePerfilGuardado('{"a":1}')).toBeNull();
  });

  it("devuelve null con dataset vacío", () => {
    expect(parsePerfilGuardado("{}")).toBeNull();
  });

  it("acepta un objeto con suficientes claves", () => {
    const p = parsePerfilGuardado(JSON.stringify({
      pais: "Estados Unidos", moneda: "USD", horas_boost: 18, eficiencia: 95, c_comun: 150,
    }));
    expect(p).not.toBeNull();
    expect(p!.pais).toBe("Estados Unidos");
  });

  it("respeta el umbral exacto de claves", () => {
    const mk = (n: number) => JSON.stringify(Object.fromEntries(
      Array.from({ length: n }, (_, i) => [`k${i}`, i])
    ));
    expect(parsePerfilGuardado(mk(MIN_KEYS_PERFIL - 1))).toBeNull();
    expect(parsePerfilGuardado(mk(MIN_KEYS_PERFIL))).not.toBeNull();
  });
});

describe("leerPerfilLocal", () => {
  beforeEach(() => localStorage.clear());

  it("devuelve null si no hay perfil guardado", () => {
    expect(leerPerfilLocal("Principal")).toBeNull();
  });

  it("lee un perfil guardado válido", () => {
    const perfil = { a: 1, b: 2, c: 3, d: 4, e: 5 };
    localStorage.setItem("ae_profile_MiPerfil", JSON.stringify(perfil));
    expect(leerPerfilLocal("MiPerfil")).toEqual(perfil);
  });

  it("ignora perfiles corruptos en vez de lanzar", () => {
    localStorage.setItem("ae_profile_Roto", "no-json{{");
    expect(leerPerfilLocal("Roto")).toBeNull();
  });
});

describe("leerListaPerfiles", () => {
  beforeEach(() => localStorage.clear());

  it("devuelve ['Principal'] si no hay lista", () => {
    expect(leerListaPerfiles()).toEqual(["Principal"]);
  });

  it("devuelve la lista guardada", () => {
    localStorage.setItem("ae_profiles", JSON.stringify(["Principal", "Alt", "Moon"]));
    expect(leerListaPerfiles()).toEqual(["Principal", "Alt", "Moon"]);
  });

  it("cae a ['Principal'] con lista vacía o corrupta", () => {
    localStorage.setItem("ae_profiles", "[]");
    expect(leerListaPerfiles()).toEqual(["Principal"]);
    localStorage.setItem("ae_profiles", "corrupto");
    expect(leerListaPerfiles()).toEqual(["Principal"]);
  });
});

describe("leerPerfilActivo", () => {
  beforeEach(() => localStorage.clear());

  it("usa el activo si existe en la lista", () => {
    localStorage.setItem("ae_active_profile", "Alt");
    expect(leerPerfilActivo(["Principal", "Alt"])).toBe("Alt");
  });

  it("cae al primero si el activo no está en la lista", () => {
    localStorage.setItem("ae_active_profile", "Fantasma");
    expect(leerPerfilActivo(["Principal", "Alt"])).toBe("Principal");
  });

  it("siempre devuelve un string válido", () => {
    expect(leerPerfilActivo([])).toBe("Principal");
    expect(leerPerfilActivo(["Solo"])).toBe("Solo");
  });
});

describe("normalizarHorasSrb", () => {
  it("siempre devuelve 64 — valor fijo del juego", () => {
    expect(normalizarHorasSrb(undefined)).toBe(64);
    expect(normalizarHorasSrb(0)).toBe(64);
    expect(normalizarHorasSrb(24)).toBe(64);
    expect(normalizarHorasSrb("50")).toBe(64);
    expect(normalizarHorasSrb(null)).toBe(64);
  });
});

describe("campoPerfil", () => {
  it("devuelve el fallback si el perfil es null", () => {
    expect(campoPerfil(null, "pais", "USA")).toBe("USA");
  });

  it("devuelve el fallback si la clave no existe", () => {
    expect(campoPerfil({ pais: "México" }, "moneda", "MXN")).toBe("MXN");
  });

  it("devuelve el fallback si el valor es null/undefined", () => {
    expect(campoPerfil({ pais: null }, "pais", "USA")).toBe("USA");
    expect(campoPerfil({ pais: undefined }, "pais", "USA")).toBe("USA");
  });

  it("devuelve el valor tipado correctamente", () => {
    expect(campoPerfil({ pais: "España" }, "pais", "USA")).toBe("España");
    expect(campoPerfil({ c_comun: 250 }, "c_comun", 0)).toBe(250);
    expect(campoPerfil({ horas_boost: 18.5 }, "horas_boost", 18)).toBe(18.5);
  });
});
