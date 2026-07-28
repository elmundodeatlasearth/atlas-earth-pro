// supabase/functions/ai-advisor/index.ts
// Edge Function de Asistente IA — EXPERTO EN ATLAS EARTH
// Recibe datos PRE-COMPUTADOS del frontend y genera análisis profundo + consejos experto
// NO duplica lógica matemática — usa los valores enviados por el cliente

import { createClient } from "jsr:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ============================================
// 1. CONSTANTES
// ============================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================
// 2. RATE LIMITER
// ============================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  if (entry.count >= RATE_LIMIT) return { allowed: false, remaining: 0 };
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(key);
    }
  }, 300_000);
}

// ============================================
// 3. TIPOS — PAYLOAD COMPLETO DESDE EL FRONTEND
// ============================================

interface PayloadAnalisis {
  // Datos crudos del usuario
  user_id: string;
  pais: string;
  moneda: string;
  comunes: number; raras: number; epicas: number; legendarias: number;
  insignias: number; ab_ahorrados: number;
  horas_boost: number; eficiencia: number; horas_srb: number;
  tipo_pase: string; hora_inicio: string; hora_fin: string;
  eficiencia_anuncios: number; dia_asistencia: number;
  meta_dolar: number; meta_periodo: string;
  // Datos pre-computados
  total_parcelas: number; mult_tier: number; pasaporte_nivel: number; renta_diaria: number;
  renta_semanal: number; renta_mensual: number; renta_anual: number;
  siguiente_tramo: number; faltantes_tier: number; colapso_tier: boolean; porcentaje_escalera: number;
  faltantes_meta: number; parcelas_meta: number;
  desglose_f2p_ab_mes: number; desglose_f2p_ab_dia: number;
  desglose_f2p_ab20min_dia: number; desglose_f2p_ab20min_mes: number; desglose_f2p_pase_mes: number;
  desglose_ec_ab_mes: number; desglose_ec_ab_dia: number;
  desglose_ec_ab20min_dia: number; desglose_ec_ab20min_mes: number; desglose_ec_pase_mes: number;
  ec_optimo_dia_inicio: number; ec_optimo_ab_netos: number; ec_optimo_ab_pase: number; ec_optimo_ab_gratis: number;
  roi_global_dias: number; roi_marginal_dias: number; renta_adicional: number;
  costo_meta_ab: number; parcelas_eq: number;
  aumento_parcelas: number; aumento_pasaporte: number;
  veredicto_estrategia: string;
  nivel_pasaporte_actual: number; nivel_pasaporte_siguiente: number;
  insignias_faltantes: number; costo_ab_pasaporte: number;
  historial_progreso?: Array<{ fecha: string; usd_generado: number; ab_generado: number }>;
}

// ============================================
// 4. SANITIZER — BLINDAJE CONTRA undefined
// ============================================

function safeNum(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
}

function sanitizarPayload(raw: Record<string, unknown>): PayloadAnalisis {
  return {
    user_id: String(raw.user_id ?? ""),
    pais: String(raw.pais ?? ""),
    moneda: String(raw.moneda ?? "USD"),
    comunes: safeNum(raw.comunes),
    raras: safeNum(raw.raras),
    epicas: safeNum(raw.epicas),
    legendarias: safeNum(raw.legendarias),
    insignias: safeNum(raw.insignias),
    ab_ahorrados: safeNum(raw.ab_ahorrados),
    horas_boost: safeNum(raw.horas_boost),
    eficiencia: safeNum(raw.eficiencia),
    horas_srb: safeNum(raw.horas_srb),
    tipo_pase: String(raw.tipo_pase ?? "Ninguno (F2P)"),
    hora_inicio: String(raw.hora_inicio ?? "08:00"),
    hora_fin: String(raw.hora_fin ?? "22:00"),
    eficiencia_anuncios: safeNum(raw.eficiencia_anuncios),
    dia_asistencia: safeNum(raw.dia_asistencia),
    meta_dolar: safeNum(raw.meta_dolar),
    meta_periodo: String(raw.meta_periodo ?? "day") as "day" | "month" | "year",
    total_parcelas: safeNum(raw.total_parcelas),
    mult_tier: safeNum(raw.mult_tier),
    pasaporte_nivel: safeNum(raw.pasaporte_nivel),
    renta_diaria: safeNum(raw.renta_diaria),
    renta_semanal: safeNum(raw.renta_semanal),
    renta_mensual: safeNum(raw.renta_mensual),
    renta_anual: safeNum(raw.renta_anual),
    siguiente_tramo: safeNum(raw.siguiente_tramo),
    faltantes_tier: safeNum(raw.faltantes_tier),
    colapso_tier: !!raw.colapso_tier,
    porcentaje_escalera: safeNum(raw.porcentaje_escalera),
    faltantes_meta: safeNum(raw.faltantes_meta),
    parcelas_meta: safeNum(raw.parcelas_meta),
    desglose_f2p_ab_mes: safeNum(raw.desglose_f2p_ab_mes),
    desglose_f2p_ab_dia: safeNum(raw.desglose_f2p_ab_dia),
    desglose_f2p_ab20min_dia: safeNum(raw.desglose_f2p_ab20min_dia),
    desglose_f2p_ab20min_mes: safeNum(raw.desglose_f2p_ab20min_mes),
    desglose_f2p_pase_mes: safeNum(raw.desglose_f2p_pase_mes),
    desglose_ec_ab_mes: safeNum(raw.desglose_ec_ab_mes),
    desglose_ec_ab_dia: safeNum(raw.desglose_ec_ab_dia),
    desglose_ec_ab20min_dia: safeNum(raw.desglose_ec_ab20min_dia),
    desglose_ec_ab20min_mes: safeNum(raw.desglose_ec_ab20min_mes),
    desglose_ec_pase_mes: safeNum(raw.desglose_ec_pase_mes),
    ec_optimo_dia_inicio: safeNum(raw.ec_optimo_dia_inicio),
    ec_optimo_ab_netos: safeNum(raw.ec_optimo_ab_netos),
    ec_optimo_ab_pase: safeNum(raw.ec_optimo_ab_pase),
    ec_optimo_ab_gratis: safeNum(raw.ec_optimo_ab_gratis),
    roi_global_dias: safeNum(raw.roi_global_dias),
    roi_marginal_dias: safeNum(raw.roi_marginal_dias),
    renta_adicional: safeNum(raw.renta_adicional),
    costo_meta_ab: safeNum(raw.costo_meta_ab),
    parcelas_eq: safeNum(raw.parcelas_eq),
    aumento_parcelas: safeNum(raw.aumento_parcelas),
    aumento_pasaporte: safeNum(raw.aumento_pasaporte),
    veredicto_estrategia: String(raw.veredicto_estrategia ?? ""),
    nivel_pasaporte_actual: safeNum(raw.nivel_pasaporte_actual),
    nivel_pasaporte_siguiente: safeNum(raw.nivel_pasaporte_siguiente),
    insignias_faltantes: safeNum(raw.insignias_faltantes),
    costo_ab_pasaporte: safeNum(raw.costo_ab_pasaporte),
    historial_progreso: Array.isArray(raw.historial_progreso) ? raw.historial_progreso : [],
  };
}

// ============================================
// 5. AN�LISIS EXPERTO � Usa datos pre-computados
// ============================================

function generarAnalisisExperto(p: PayloadAnalisis): string {
  const partes: string[] = [];

  // Meta diaria real
  const metaDiaria = p.meta_periodo === "month" ? p.meta_dolar / 30
    : p.meta_periodo === "year" ? p.meta_dolar / 365
    : p.meta_dolar;
  const pctMeta = p.renta_diaria > 0 && metaDiaria > 0
    ? Math.min(100, (p.renta_diaria / metaDiaria) * 100)
    : 0;

  // ===== 1. VEREDICTO PRINCIPAL =====
  let veredicto = "";
  let estado = "";
  let emojiEstado = "";

  if (p.renta_diaria >= metaDiaria && metaDiaria > 0) {
    veredicto = "🎯 ¡META ALCANZADA! Ya generas suficiente renta diaria para cumplir tu objetivo. Es momento de redefinir tu meta al alza o considerar retirar ganancias.";
    estado = "EXCELENTE"; emojiEstado = "🏆";
  } else if (pctMeta >= 75) {
    veredicto = `🔥 Vas excelente. Estás al ${pctMeta.toFixed(0)}% de tu meta de $${metaDiaria.toFixed(4)} USD/día. Unos cuantos saltos de Tier y llegas.`;
    estado = "BUENO"; emojiEstado = "🔥";
  } else if (pctMeta >= 50) {
    veredicto = `📈 Progreso sólido (${pctMeta.toFixed(0)}% de meta). Sigue farmeando AB y optimizando tu estrategia de compras.`;
    estado = "REGULAR"; emojiEstado = "📈";
  } else if (pctMeta >= 25) {
    veredicto = `🌱 Estás en camino (${pctMeta.toFixed(0)}% de meta). Enfócate en acumular parcelas y subir tu pasaporte.`;
    estado = "TEMPRANO"; emojiEstado = "🌱";
  } else {
    veredicto = `🚀 Estás comenzando tu viaje en Atlas Earth (${pctMeta.toFixed(0)}% de meta). Cada parcela cuenta — prioriza llegar a 40 parcelas y activa boost 20h/día.`;
    estado = "INICIO"; emojiEstado = "🚀";
  }

  // Si está en colapso de Tier, el veredicto se vuelve dramático
  if (p.colapso_tier) {
    veredicto = `🚨 🚨 ¡ALERTA MÁXIMA! 🚨 🚨 Estás en ZONA DE COLAPSO — solo te faltan ${p.faltantes_tier} parcelas para el siguiente salto de Tier. NO COMPRES parcelas individuales. Acumula ${p.costo_meta_ab.toLocaleString()} AB y salta directo a ${p.siguiente_tramo} parcelas.`;
    estado = "COLAPSO";
    emojiEstado = "🚨";
  }

  // ===== 2. ESTADO ACTUAL =====
  partes.push(`<h1>${emojiEstado} Veredicto: ${estado}</h1>`);
  partes.push(`<div class="card card-${estado === "COLAPSO" ? "red" : estado === "EXCELENTE" ? "green" : estado === "BUENO" ? "green" : estado === "REGULAR" ? "gold" : "blue"}"><strong>${veredicto}</strong></div>`);

  // ===== 3. MÉTRICAS CLAVE =====
  partes.push(`<h2>📊 Radiografía de tu Cuenta</h2>`);
  partes.push(`<div class="grid grid-cols-2 gap-2">`);
  const metricas: [string, string, string][] = [
    ["Parcelas", `${p.total_parcelas} (${p.comunes}C · ${p.raras}R · ${p.epicas}E · ${p.legendarias}L)`, "text-cyan-400"],
    ["Multiplicador", `${p.mult_tier}x`, "text-blue-400"],
    ["Pasaporte", `Nivel ${p.pasaporte_nivel} (+${p.pasaporte_nivel * 5}%) — ${p.insignias} insignias`, "text-amber-400"],
    ["Renta", `$${p.renta_diaria.toFixed(7)}/día ≈ $${p.renta_mensual.toFixed(4)}/mes`, "text-green-400"],
    ["AB Ahorrados", `${p.ab_ahorrados.toLocaleString()} AB`, "text-purple-400"],
    ["Boost", `${p.horas_boost}h/día al ${p.eficiencia}% efectividad`, p.horas_boost >= 18 && p.eficiencia >= 90 ? "text-green-400" : "text-orange-400"],
    ["SRB", `${p.horas_srb}h/mes`, "text-yellow-400"],
    ["Tier Actual", `${p.total_parcelas} → Siguiente: ${p.siguiente_tramo} (faltan ${p.faltantes_tier})`, p.colapso_tier ? "text-red-400" : "text-cyan-400"],
    ["Progreso Meta", `${pctMeta.toFixed(1)}% (${p.faltantes_meta > 0 ? `faltan ${p.faltantes_meta} parcelas` : "✅ Alcanzada"})`, p.faltantes_meta > 0 ? "text-orange-400" : "text-green-400"],
  ];

  // Desglose AB F2P
  if (p.desglose_f2p_ab20min_dia > 0) {
    metricas.push(["⏱️ AB 20min/día", `${p.desglose_f2p_ab20min_dia.toFixed(0)} AB/día (×${(p.desglose_f2p_ab20min_mes).toLocaleString()} AB/mes)`, "text-green-400"]);
  }
  if (p.desglose_f2p_pase_mes > 0) {
    metricas.push(["📦 AB Pase/mes", `${p.desglose_f2p_pase_mes.toLocaleString()} AB/mes (${(p.desglose_f2p_pase_mes / 30).toFixed(0)} AB/día)`, "text-amber-400"]);
  }
  metricas.push(["🧮 AB F2P total/día", `${p.desglose_f2p_ab_dia.toFixed(1)} AB/día → ${p.desglose_f2p_ab_mes.toLocaleString()} AB/mes`, "text-green-400"]);
  if (p.tipo_pase !== "Ninguno (F2P)") {
    metricas.push(["🧮 AB EC total/día", `${p.desglose_ec_ab_dia.toFixed(1)} AB/día → ${p.desglose_ec_ab_mes.toLocaleString()} AB/mes`, "text-amber-400"]);
  }
  for (const [label, value, color] of metricas) {
    partes.push(`<div class="p-2 bg-[#0a0a0a] rounded-lg border border-white/5"><div class="text-[10px] text-gray-500">${label}</div><div class="font-bold ${color} text-sm">${value}</div></div>`);
  }
  partes.push(`</div>`);

  // ===== 4. ANÁLISIS DE COMPOSICIÓN =====
  const total = p.total_parcelas;
  const pctC = (p.comunes / total) * 100;
  const pctR = (p.raras / total) * 100;
  const pctE = (p.epicas / total) * 100;
  const pctL = (p.legendarias / total) * 100;

  partes.push(`<h2>🔬 Análisis de Composición</h2>`);
  partes.push(`<div class="card">`);
  partes.push(`<p>Distribución: <strong>${pctC.toFixed(0)}%</strong> Comunes · <strong>${pctR.toFixed(0)}%</strong> Raras · <strong>${pctE.toFixed(0)}%</strong> Épicas · <strong>${pctL.toFixed(0)}%</strong> Legendarias</p>`);

  if (pctL >= 10) partes.push(`<p>💎 <strong>Excelente proporción de Legendarias (${pctL.toFixed(0)}%).</strong> Tu renta base es sólida — ahora maximiza multiplicadores.</p>`);
  else if (pctL >= 5) partes.push(`<p>💎 <strong>Bien de Legendarias (${pctL.toFixed(0)}%).</strong> Considera fusionar en eventos para mejorarlas.</p>`);
  else partes.push(`<p>⚠️ <strong>Bajas Legendarias (${pctL.toFixed(0)}%).</strong> Tu renta depende mucho de las épicas. Prioriza eventos de fusión.</p>`);

  if (pctC > 70) partes.push(`<p>🔄 Demasiadas <strong>Comunes (${pctC.toFixed(0)}%).</strong> Fusiona en eventos para subir rareza.</p>`);
  if (pctR > 25) partes.push(`<p>📊 Buen ratio de Raras (${pctR.toFixed(0)}%).</p>`);
  partes.push(`</div>`);

  // ===== 5. ESTRATEGIA DE TIERS =====
  partes.push(`<h2>🏆 Estrategia de Tiers</h2>`);
  if (p.colapso_tier) {
    partes.push(`<div class="card card-red">`);
    partes.push(`<p><strong>🚨 ¡ZONA DE COLAPSO ACTIVA!</strong></p>`);
    partes.push(`<p>Estás en el Tier de <strong>${p.total_parcelas}</strong> parcelas. El siguiente salto es a <strong>${p.siguiente_tramo}</strong>.</p>`);
    partes.push(`<p>Te faltan solo <strong>${p.faltantes_tier} parcelas</strong> (≈${p.costo_meta_ab.toLocaleString()} AB).</p>`);
    partes.push(`<p><span class="badge badge-red">⚠️ NO COMPRES PARCELAS INDIVIDUALES</span> Cada parcela individual en colapso te da <strong>menos del 1% del multiplicador</strong> que obtendrías al saltar. Acumula y salta de golpe.</p>`);
    partes.push(`</div>`);
  } else {
    partes.push(`<div class="card card-blue">`);
    partes.push(`<p>Estás en el Tier de <strong>${p.total_parcelas}</strong>, camino a <strong>${p.siguiente_tramo}</strong>.</p>`);
    partes.push(`<p>Faltan <strong>${p.faltantes_tier} parcelas</strong> (${p.porcentaje_escalera.toFixed(1)}% del camino). Sigue comprando.</p>`);

    // Calcular AB necesarios
    if (p.faltantes_tier > 0) {
      const abNecesarios = p.faltantes_tier * 100;
      const diasF2P = p.desglose_f2p_ab_dia > 0 ? abNecesarios / p.desglose_f2p_ab_dia : 0;
      const diasEC = p.desglose_ec_ab_dia > 0 ? abNecesarios / p.desglose_ec_ab_dia : diasF2P;
      partes.push(`<p>💰 Necesitas ~<strong>${abNecesarios.toLocaleString()} AB</strong> para llegar. `);
      partes.push(`⏱️ ~<strong>${diasF2P.toFixed(0)} días F2P</strong>`);
      if (p.tipo_pase === "Ninguno (F2P)") {
        partes.push(` (${diasF2P > 0 ? `≈${(diasF2P / 30).toFixed(1)} meses` : "N/A"}). Considera Explorer Club para acelerar ×2.</p>`);
      } else {
        partes.push(` · ~<strong>${diasEC.toFixed(0)} días con EC</strong>.</p>`);
      }
    }
    partes.push(`</div>`);
  }

  // ===== 6. OPTIMIZACIÓN PASAPORTE =====
  if (p.nivel_pasaporte_actual < 5) {
    partes.push(`<h2>🛂 Optimización de Pasaporte</h2>`);
    partes.push(`<div class="card card-gold">`);
    if (p.insignias_faltantes > 0) {
      partes.push(`<p>Pasaporte Nivel <strong>${p.nivel_pasaporte_actual}</strong> → Nivel <strong>${p.nivel_pasaporte_siguiente}</strong>.</p>`);
      partes.push(`<p>Faltan <strong>${p.insignias_faltantes} insignias</strong> (${p.costo_ab_pasaporte.toLocaleString()} AB).</p>`);

      // Comparación parcela vs pasaporte
      if (p.aumento_pasaporte > p.aumento_parcelas) {
        partes.push(`<p>✅ <strong>Prioriza insignias:</strong> cada insignia te da +${((p.aumento_pasaporte - p.aumento_parcelas) / p.aumento_parcelas * 100).toFixed(0)}% más renta que comprar parcelas.</p>`);
      } else if (p.aumento_parcelas > p.aumento_pasaporte) {
        partes.push(`<p>✅ <strong>Prioriza parcelas:</strong> ${p.parcelas_eq} parcelas te dan +$${(p.aumento_parcelas - p.aumento_pasaporte).toFixed(7)}/día más que subir pasaporte.</p>`);
      }
    } else {
      partes.push(`<p>✅ Tienes suficientes insignias para el siguiente nivel. ¡Cómpralas ahora!</p>`);
    }
    partes.push(`</div>`);
  } else {
    partes.push(`<h2>🛂 Pasaporte</h2>`);
    partes.push(`<div class="card card-green"><p>✅ Pasaporte en Nivel <strong>5 (MÁXIMO)</strong>. Crecimiento puro por parcelas ahora.</p></div>`);
  }

  // ===== 7. OPTIMIZADOR EXPLORER CLUB =====
  if (p.ec_optimo_dia_inicio > 0) {
    partes.push(`<h2>📆 Optimizador Explorer Club</h2>`);
    partes.push(`<div class="card card-green">`);
    partes.push(`<p>🧠 <strong>Momento óptimo:</strong> Compra EC el <strong>Día ${p.ec_optimo_dia_inicio}</strong> del mes.</p>`);
    partes.push(`<p>📦 AB del pase: <strong>${p.ec_optimo_ab_pase.toLocaleString()} AB</strong></p>`);
    partes.push(`<p>🆓 AB gratis en mismo período: <strong>${p.ec_optimo_ab_gratis.toLocaleString()} AB</strong></p>`);
    partes.push(`<p>🔥 <strong>Ganancia neta: +${p.ec_optimo_ab_netos.toLocaleString()} AB 🚀</strong></p>`);
    partes.push(`</div>`);
  }

  // ===== 8. ANÁLISIS ROI =====
  if (p.roi_global_dias > 0 || p.roi_marginal_dias > 0) {
    partes.push(`<h2>📈 Análisis de ROI</h2>`);
    partes.push(`<div class="grid grid-cols-2 gap-2">`);
    if (p.roi_global_dias > 0) {
      const años = p.roi_global_dias / 365;
      partes.push(`<div class="p-2 bg-[#0a0a0a] rounded-lg border border-white/5"><div class="text-[10px] text-gray-500">🌍 ROI Global</div><div class="font-bold text-white">${años.toFixed(1)} años</div></div>`);
    }
    if (p.roi_marginal_dias > 0) {
      const color = p.roi_marginal_dias <= 365 ? "text-green-400" : p.roi_marginal_dias <= 1095 ? "text-orange-400" : "text-red-400";
      partes.push(`<div class="p-2 bg-[#0a0a0a] rounded-lg border border-white/5"><div class="text-[10px] text-gray-500">⚡ ROI Marginal</div><div class="font-bold ${color}">${(p.roi_marginal_dias / 365).toFixed(1)} años</div></div>`);
    }
    partes.push(`</div>`);
  }

  // ===== 9. RECOMENDACIONES PERSONALIZADAS =====
  partes.push(`<h2>🎯 Recomendaciones Prioritarias</h2>`);
  partes.push(`<ul>`);

  // Recomendación #1: Colapso
  if (p.colapso_tier) {
    partes.push(`<li><span class="badge badge-red">🚨 CRÍTICO</span> <strong>NO COMPRES parcelas sueltas.</strong> Acumula ${p.costo_meta_ab.toLocaleString()} AB y salta a ${p.siguiente_tramo} parcelas.</li>`);
  }

  // Recomendación #2: Boost
  if (p.horas_boost < 18) {
    partes.push(`<li><span class="badge badge-red">⚠️ BOOST</span> Solo tienes ${p.horas_boost}h de boost. <strong>Mínimo 18h/día</strong> — ideal 20-22h para maximizar renta ×2.</li>`);
  } else if (p.horas_boost < 22) {
    partes.push(`<li><span class="badge badge-green">✅ BOOST</span> Buenas ${p.horas_boost}h de boost. Intenta llegar a 22h si puedes.</li>`);
  } else {
    partes.push(`<li><span class="badge badge-green">💪 BOOST</span> Excelente! ${p.horas_boost}h/día maximizadas.</li>`);
  }

  // Recomendación #3: Efectividad
  if (p.eficiencia < 90) {
    partes.push(`<li><span class="badge badge-red">⚠️ EFECTIVIDAD</span> Solo ${p.eficiencia}% — <strong>sube al 90%+</strong> para no perder renta por boost apagado.</li>`);
  }

  // Recomendación #4: Pasaporte
  if (p.nivel_pasaporte_actual < 3 && p.insignias_faltantes > 0) {
    partes.push(`<li><span class="badge badge-gold">🛂 PRIORIDAD</span> <strong>Sube tu pasaporte a Nivel ${Math.min(3, p.nivel_pasaporte_siguiente)}</strong> — es la inversión con mejor retorno al principio.</li>`);
  }

  // Recomendación #5: SRB
  if (p.horas_srb < 20) {
    partes.push(`<li><span class="badge badge-blue">🚀 SRB</span> Solo ${p.horas_srb}h de SRB este mes. <strong>Participa más en SRB</strong> — es la mejor fuente de AB extra.</li>`);
  }

  // Recomendación #6: F2P vs EC
  if (p.tipo_pase === "Ninguno (F2P)") {
    const extraAB = p.desglose_ec_ab_mes - p.desglose_f2p_ab_mes;
    if (extraAB > 0) {
      partes.push(`<li><span class="badge badge-gold">💎 EC</span> <strong>Explorer Club te daría +${extraAB.toLocaleString()} AB/mes</strong> (${p.desglose_ec_ab_dia.toFixed(0)} AB/día vs ${p.desglose_f2p_ab_dia.toFixed(0)} AB/día).</li>`);
    }
  }

  // Recomendación #7: Guardar en nube
  partes.push(`<li><span class="badge badge-blue">📊 SEGUIMIENTO</span> Guarda tu progreso semanal en el Historial para ver tu evolución.</li>`);

  partes.push(`</ul>`);

  // ===== 10. PRÓXIMOS PASOS CONCRETOS =====
  partes.push(`<h2>📋 Plan de Acción — Próximos 30 Días</h2>`);
  partes.push(`<div class="card card-blue">`);
  if (p.colapso_tier) {
    partes.push(`<p>1️⃣ 🚫 <strong>No compres nada</strong> hasta tener ${p.costo_meta_ab.toLocaleString()} AB.</p>`);
    partes.push(`<p>2️⃣ 📺 <strong>Farme anuncios</strong> + ruleta todos los días.</p>`);
    partes.push(`<p>3️⃣ 🚀 <strong>Salta directo</strong> a ${p.siguiente_tramo} parcelas cuando tengas los AB.</p>`);
  } else if (p.nivel_pasaporte_actual < 3 && p.insignias_faltantes > 0) {
    partes.push(`<p>1️⃣ 🛂 <strong>Compra ${p.insignias_faltantes} insignias</strong> para subir a Pasaporte Nivel ${p.nivel_pasaporte_siguiente}.</p>`);
    partes.push(`<p>2️⃣ 🏞️ <strong>Sigue comprando parcelas</strong> hasta ${p.siguiente_tramo}.</p>`);
    partes.push(`<p>3️⃣ 📈 <strong>Registra tu progreso</strong> cada semana en el Historial.</p>`);
  } else {
    partes.push(`<p>1️⃣ 🏞️ <strong>Sigue comprando parcelas</strong> hasta ${p.siguiente_tramo}.</p>`);
    partes.push(`<p>2️⃣ ⚡ <strong>Optimiza boost</strong> al máximo (20h+).</p>`);
    partes.push(`<p>3️⃣ 📈 <strong>Monitorea tu progreso</strong> en el Dashboard.</p>`);
  }
  partes.push(`</div>`);

  // ===== 11. FRASE MOTIVACIONAL =====
  const frases: Record<string, string> = {
    "COLAPSO": "🔥 La paciencia paga. Un salto de Tier bien ejecutado vale más que 100 compras impulsivas. ¡AGUANTA! 💪",
    "EXCELENTE": "🏆 Ya domina el juego. Ahora es scale up — más parcelas, más renta, más libertad. ¡A POR EL SIGUIENTE NIVEL! 🚀",
    "BUENO": "🔥 Vas rompiendo. La meta está cerca — no bajes el ritmo. ¡CADA PARCELA CUENTA! 💪",
    "REGULAR": "📈 Progreso constante gana la carrera. Sigue farmeando, sigue comprando. ¡EL ÉXITO ES CUESTIÓN DE TIEMPO! ⏳",
    "TEMPRANO": "🌱 Todos empezamos desde cero. Tu dedicación te llevará lejos. ¡QUE NADIE TE DETENGA! 🚀",
    "INICIO": "🚀 El viaje de 1000 parcelas comienza con una. ¡TÚ PUEDES! 💪",
  };
  partes.push(`<p class="text-center text-sm italic text-purple-300 mt-4">${frases[estado] || "¡Sigue adelante!"}</p>`);

  return partes.join("\n");
}

// ============================================
// 5. FORMATO HTML PREMIUM
// ============================================

function formatearHTML(contenidoAnalisis: string): string {
  return `
    <div class="space-y-4 text-sm leading-relaxed">
      ${contenidoAnalisis}
      <div class="mt-6 pt-4 border-t border-white/5 text-center text-[10px] text-gray-600">
        Generado por <strong>Atlas Earth PRO AI</strong> — Experto en estrategia Atlas Earth ·
        Datos de tu perfil en tiempo real
      </div>
    </div>
  `;
}

// ============================================
// 6. SERVER — Edge Function Principal
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const rawBody = await req.json();
    const payload = sanitizarPayload(rawBody);

    // Validar campos criticos
    if (!payload.user_id || payload.total_parcelas === 0) {
      return new Response(JSON.stringify({ error: 'Datos insuficientes para generar analisis' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // ===== VALIDACIÓN JWT =====
    let userId = payload.user_id;
    const authHeader = req.headers.get('Authorization') || '';

    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (!authError && user) userId = user.id;
      } catch { console.warn("JWT validation failed"); }
    }

    const { data: userData, error: userError } = await supabase
      .from('usuarios_atlas')
      .select('ai_credits, is_ultra, is_vip')
      .eq('user_id', userId)
      .single();

    let ai_credits = 0;
    let is_ultra = false;
    let is_vip = false;

    if (!userError && userData) {
      ai_credits = userData.ai_credits ?? 0;
      is_ultra = userData.is_ultra ?? false;
      is_vip = userData.is_vip ?? false;
    } else {
      // Usuario no encontrado → crear registro con créditos gratis
      try {
        const { data: newUser, error: insertError } = await supabase
          .from('usuarios_atlas')
          .upsert({ user_id: userId, ai_credits: 3, is_vip: false, is_ultra: false })
          .select('ai_credits')
          .single();
        if (!insertError && newUser) ai_credits = newUser.ai_credits ?? 3;
        else ai_credits = 1; // fallback: 1 crédito de cortesía
      } catch {
        ai_credits = 1;
      }
    }

    // ===== RATE LIMIT =====
    const rl = checkRateLimit(userId);
    if (!rl.allowed) {
      return new Response(JSON.stringify({
        error: "⏳ Demasiadas solicitudes. Espera un minuto.",
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 })
    }

    // ===== CRÉDITOS: Solo requerir para usuarios registrados =====
    if (userId !== "anon") {
      if (!is_ultra && ai_credits <= 0) {
        return new Response(JSON.stringify({
          error: "Acceso bloqueado. Necesitas créditos IA o plan Ultra."
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
      }
    }

    // ================================================
    // 7. EJECUTAR ANÁLISIS EXPERTO
    // ================================================

    // Siempre generar el análisis local primero
    const analisisLocal = generarAnalisisExperto(payload);

    // Intentar Morph LLM para enriquecer
    const morphApiKey = Deno.env.get("MORPH_API_KEY");
    let aiAdvice = "";
    let usedFallback = true;

    if (morphApiKey) {
      try {
        const metaDiaria = payload.meta_periodo === "month" ? payload.meta_dolar / 30
          : payload.meta_periodo === "year" ? payload.meta_dolar / 365
          : payload.meta_dolar;

        const promptUsuario = `ANALIZA MI CUENTA DE ATLAS EARTH COMO EXPERTO MUNDIAL:

DATOS DEL PERFIL:
- País: ${payload.pais} | Moneda: ${payload.moneda}
- Total parcelas: ${payload.total_parcelas} (${payload.comunes}C ${payload.raras}R ${payload.epicas}E ${payload.legendarias}L)
- Pasaporte: Nivel ${payload.pasaporte_nivel} (+${payload.pasaporte_nivel * 5}%) | ${payload.insignias} insignias
- Multiplicador Tier: ${payload.mult_tier}x
- Renta: $${payload.renta_diaria.toFixed(7)}/día | $${payload.renta_semanal.toFixed(4)}/semana | $${payload.renta_mensual.toFixed(4)}/mes
- AB ahorrados: ${payload.ab_ahorrados.toLocaleString()}
- Boost: ${payload.horas_boost}h/día al ${payload.eficiencia}% efectividad
- SRB: ${payload.horas_srb}h/mes
- Pase: ${payload.tipo_pase}
- ⏱️ AB 20min: ${payload.desglose_f2p_ab20min_dia.toFixed(0)} AB/día | ${payload.desglose_f2p_ab20min_mes.toLocaleString()} AB/mes${payload.tipo_pase !== "Ninguno (F2P)" ? `\n- 📦 AB Pase: ${payload.desglose_f2p_pase_mes.toLocaleString()} AB/mes` : ""}
- 🧮 AB F2P total: ${payload.desglose_f2p_ab_dia.toFixed(1)} AB/día | ${payload.desglose_f2p_ab_mes.toLocaleString()} AB/mes
${payload.tipo_pase !== "Ninguno (F2P)" ? `- 🧮 AB EC total: ${payload.desglose_ec_ab_dia.toFixed(1)} AB/día | ${payload.desglose_ec_ab_mes.toLocaleString()} AB/mes` : ""}
- Meta: $${metaDiaria.toFixed(4)} USD/día | Progreso: ${Math.min(100, (payload.renta_diaria / (metaDiaria || 1)) * 100).toFixed(1)}%

ESTRATEGIA COMPUTADA:
- Tier actual: ${payload.total_parcelas} → Siguiente: ${payload.siguiente_tramo} (faltan ${payload.faltantes_tier})
- ${payload.colapso_tier ? "🚨 ZONA DE COLAPSO ACTIVA" : "Tier estable"}
- ${payload.nivel_pasaporte_actual < 5 ? `Pasaporte: faltan ${payload.insignias_faltantes} insignias` : "Pasaporte Máximo"}
${payload.ec_optimo_dia_inicio > 0 ? `- EC Óptimo: Día ${payload.ec_optimo_dia_inicio} (+${payload.ec_optimo_ab_netos.toLocaleString()} AB netos)` : ""}

INSTRUCCIONES ESTRICTAS (SIGUE AL PIE DE LA LETRA):
1. Eres el mayor experto mundial en Atlas Earth — conoces Tiers, composición, pasaportes, EC, ROI
2. Responde SOLO en español, lenguaje DIRECTO y ACCIONABLE
3. NO saludes NI te presentes — ve directo al análisis
4. Usa <strong> para cifras clave
5. Estructura tu respuesta EXACTAMENTE así:
   Párrafo 1: VEREDICTO PRINCIPAL en 1-2 oraciones contundentes
   Párrafo 2: QUÉ HACER AHORA (máximo 3 balas con <br/>)
   Párrafo 3: PRONÓSTICO — qué pasará si sigue esta estrategia en 30/90/365 días
   Párrafo 4: FRASE MOTIVACIONAL ULTRA agresiva y corta (máximo 10 palabras)
6. Si está en colapso de Tier, el tono debe ser DRAMÁTICO con mayúsculas
7. NO repitas los datos que ya te pasé
8. Máximo 4 párrafos cortos`;

        const morphResponse = await fetch("https://api.morphllm.com/v1/chat/completions", {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${morphApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: "morph-v3-fast",
            messages: [
              { role: "system", content: "Eres un experto mundial en Atlas Earth, con conocimiento profundo de mecánicas de Tiers, multiplicadores, composición de parcelas, pasaportes, Explorer Club, SRB y optimización de renta. Das consejos precisos, directos y accionables. Responde SOLO en español. No saludas ni te presentas." },
              { role: "user", content: promptUsuario }
            ],
            temperature: 0.4,
            max_tokens: 500,
          })
        });
        if (morphResponse.ok) {
          const morphData = await morphResponse.json();
          if (morphData.choices?.[0]?.message?.content) {
            aiAdvice = morphData.choices[0].message.content;
            usedFallback = false;
          }
        }
      } catch { console.warn("Morph LLM falló"); }
    }

    // Si hay consejo IA, insertarlo al inicio del HTML
    let htmlFinal = analisisLocal;

    if (aiAdvice && !usedFallback) {
      // Convertir saltos de línea a <br/> y limpiar
      const cleanedAdvice = aiAdvice
        .replace(/\n\n+/g, '</p><p>')
        .replace(/\n/g, '<br/>');
      htmlFinal = `
        <div class="mb-6 p-5 bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-cyan-900/10 rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-900/20">
          <div class="text-[10px] text-gray-500 uppercase tracking-widest mb-3 font-bold flex items-center gap-2">
            <span>🤖 Asesor Experto Atlas Earth</span>
            <span class="text-purple-400">● LIVE</span>
          </div>
          <div class="text-sm leading-relaxed text-gray-100 space-y-2">
            <p>${cleanedAdvice}</p>
          </div>
        </div>
        ${analisisLocal}
      `;
    }

    // Descontar crédito si no es Ultra
    if (!is_ultra && !usedFallback) {
      const { error: deductError } = await supabase
        .from('usuarios_atlas')
        .update({ ai_credits: ai_credits - 1 })
        .eq('user_id', userId)
        .gt('ai_credits', 0);
      if (!deductError) ai_credits -= 1;
    }

    return new Response(JSON.stringify({
      advice: formatearHTML(htmlFinal),
      remaining_credits: is_ultra ? 999 : (usedFallback ? ai_credits : Math.max(0, ai_credits - 1)),
      source: usedFallback ? "local" : "morph+local",
      _rate_limit_remaining: rl.remaining,
      _local_analysis: htmlFinal.substring(0, 200), // preview para debug
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-RateLimit-Remaining': String(rl.remaining) }, status: 200 })

  } catch (err) {
    console.error("Internal Edge Error:", err)
    const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
    return new Response(JSON.stringify({ error: errorMsg || "Error desconocido en el servidor" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    })
  }
})
