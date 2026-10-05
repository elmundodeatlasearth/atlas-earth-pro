// src/__tests__/simuladorAuditoria.test.ts
// Auditoría profunda y detallada del Simulador de Atlas Earth Pro
import {
  MotorAtlasEarth,
  calcularNivelPasaporte,
  TIERS_COMPLETOS,
  SimuladorDiario,
  AB_POR_PARCELA,
} from "@/utils/atlasMath";

describe("Auditoría Detallada del Simulador — Perfil Real 435 Parcelas", () => {
  // Configuración real del usuario:
  // 435 parcelas: 139 C, 148 R, 90 E, 58 L
  // 141 insignias -> Nivel 5 (+25% = 1.25x)
  // País: Estados Unidos
  // Modo Explorer Club: 24h boost, 100% eficiencia
  const C = 139;
  const R = 148;
  const E = 90;
  const L = 58;
  const PASAPORTE_NV5 = 5;
  const BOOST_EC_24H = 24;
  const EFICIENCIA_100 = 100;
  const HORAS_SRB_MES = 64;

  const motorEC = new MotorAtlasEarth(
    C, R, E, L,
    PASAPORTE_NV5,
    BOOST_EC_24H,
    EFICIENCIA_100
  );

  it("debe validar la composición de 435 parcelas y pasaporte nivel 5", () => {
    expect(motorEC.total_parcelas).toBe(435);
    expect(calcularNivelPasaporte(141)).toBe(5);
    expect(motorEC.pasaporte_mult).toBe(1.25);
  });

  it("debe verificar que 435 parcelas en USA están exactamente en el tope del tramo 10x", () => {
    const multActual = motorEC._get_tier_mult(435, "Estados Unidos", TIERS_COMPLETOS);
    expect(multActual).toBe(10);

    const escalera = motorEC.calcular_escalera("Estados Unidos", TIERS_COMPLETOS);
    expect(escalera.tramo_actual).toBe(435);
    expect(escalera.siguiente_tramo).toBe(545);
    expect(escalera.faltantes).toBe(110);
  });

  it("debe verificar el efecto Tier Drop al comprar 1 parcela más (436 parcelas)", () => {
    const mult436 = motorEC._get_tier_mult(436, "Estados Unidos", TIERS_COMPLETOS);
    expect(mult436).toBe(8); // Cae de 10x a 8x
    expect(mult436).toBeLessThan(10);
  });

  it("debe calcular correctamente la capacidad de compra y % alcanzado con saldo AB", () => {
    const abAhorrados = 2500;
    const parcelasComprablesYa = Math.floor(abAhorrados / AB_POR_PARCELA);
    expect(parcelasComprablesYa).toBe(25);

    // Simulación A: 110 parcelas (salto de tier a 545)
    const simExtra110 = 110;
    const costoAb110 = simExtra110 * AB_POR_PARCELA; // 11,000 AB
    expect(costoAb110).toBe(11000);

    const pct110 = (abAhorrados / costoAb110) * 100;
    expect(pct110).toBeCloseTo(22.727, 2);
    const faltanAb110 = Math.max(0, costoAb110 - abAhorrados);
    expect(faltanAb110).toBe(8500);

    // Simulación B: 20 parcelas
    const simExtra20 = 20;
    const costoAb20 = simExtra20 * AB_POR_PARCELA; // 2,000 AB
    const pct20 = (abAhorrados / costoAb20) * 100;
    expect(pct20).toBeGreaterThanOrEqual(100);
    expect(abAhorrados - costoAb20).toBe(500); // Sobran 500 AB
  });

  it("debe calcular correctamente la meta automática en USD al día", () => {
    // Meta de $1.00 USD al día
    const meta1Dolar = motorEC.calcular_meta_automatica(
      1.0,
      "Estados Unidos",
      TIERS_COMPLETOS,
      HORAS_SRB_MES
    );
    expect(meta1Dolar.p_test).toBeGreaterThanOrEqual(435);
    expect(meta1Dolar.renta_test).toBeGreaterThanOrEqual(1.0);

    // Meta alcanzada (menor a la renta actual)
    const rentaActual = motorEC.calcular_renta_diaria_normal(10);
    const metaBaja = motorEC.calcular_meta_automatica(
      rentaActual * 0.5,
      "Estados Unidos",
      TIERS_COMPLETOS,
      HORAS_SRB_MES
    );
    expect(metaBaja.p_test).toBe(435);
  });

  it("debe calcular cuantas parcelas faltan para 1 USD/dia SIN EL PASE (dia normal 24h)", () => {
    // Sin pase: 22h boost al día, día normal cada 24 horas (sin SRB: horas_srb = 0)
    const motorSinPase = new MotorAtlasEarth(C, R, E, L, PASAPORTE_NV5, 22, 100);
    
    // Renta actual sin pase en día normal (10x):
    const rentaActualSinPase = motorSinPase.calcular_renta_diaria_normal(10);
    expect(rentaActualSinPase).toBeCloseTo(0.8421, 3);

    // Meta: 1.0 USD diario cada 24 horas (sin SRB, horas_srb = 0)
    const meta1SinPaseDiaNormal = motorSinPase.calcular_meta_automatica(
      1.0,
      "Estados Unidos",
      TIERS_COMPLETOS,
      0 // Día normal de 24 horas, sin SRB
    );
    expect(meta1SinPaseDiaNormal.p_test).toBe(2960);
    expect(meta1SinPaseDiaNormal.renta_test).toBeGreaterThanOrEqual(1.0);
    expect(meta1SinPaseDiaNormal.p_test - 435).toBe(2525);

    // Con pase (24h boost):
    const motorConPase = new MotorAtlasEarth(C, R, E, L, PASAPORTE_NV5, 24, 100);
    const meta1ConPaseDiaNormal = motorConPase.calcular_meta_automatica(
      1.0,
      "Estados Unidos",
      TIERS_COMPLETOS,
      0
    );
    expect(meta1ConPaseDiaNormal.p_test).toBe(2832);
    expect(meta1ConPaseDiaNormal.p_test - 435).toBe(2397);
  });

  it("debe verificar que la renta diaria normal y promedio mensual son exactas", () => {
    // Renta con 435 parcelas en Explorer Club (24h boost)
    const rentaDiaNormal = motorEC.calcular_renta_diaria_normal(10);
    expect(rentaDiaNormal).toBeCloseTo(0.9103, 3);

    // Promedio mensual con 64h SRB prorrateadas a 30 días
    const rentaMensual = motorEC.calcular_renta_mensual(10, HORAS_SRB_MES);
    const rentaDiaSrb = rentaMensual / 30;
    expect(rentaDiaSrb).toBeCloseTo(1.2340, 3);
  });

  it("debe verificar que el SimuladorDiario genera AB exactos para F2P y Explorer Club", () => {
    const diaAsistencia = 1;
    const maxAnuncios = 48; // 16 horas despierto
    const abPorAd = 2; // USA
    const sim = new SimuladorDiario(diaAsistencia, maxAnuncios, abPorAd, 1.0);

    const desgloseF2p = sim.simular_mes_desglosado(false);
    const desgloseEc = sim.simular_mes_desglosado(true);

    expect(desgloseF2p.promedio_diario).toBeGreaterThan(0);
    expect(desgloseEc.promedio_diario).toBeGreaterThan(desgloseF2p.promedio_diario);
    expect(desgloseEc.total_90d).toBeGreaterThan(desgloseF2p.total_90d);
  });
});
