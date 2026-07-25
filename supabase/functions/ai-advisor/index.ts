// supabase/functions/ai-advisor/index.ts
// Edge Function de Asistente IA — analiza datos PRE-COMPUTADOS del frontend
// YA NO duplica lógica matemática de atlasMath.ts — usa valores enviados por el cliente

import "jsr:@supabase/supabase-js@2";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ============================================
// 1. CONSTANTES COMPARTIDAS
// ============================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================
// 2. TIPOS
// ============================================

interface PayloadAnalisis {
  user_id: string;
  pais: string;
  moneda: string;
  comunes: number;
  raras: number;
  epicas: number;
  legendarias: number;
  insignias: number;
  ab_ahorrados: number;
  horas_boost: number;
  eficiencia: number;
  horas_srb: number;
  tipo_pase: string;
  hora_inicio: string;
  hora_fin: string;
  eficiencia_anuncios: number;
  dia_asistencia: number;
  meta_dolar: number;
  meta_periodo: string;
  // VALORES PRE-COMPUTADOS desde el frontend — NO se recalculan aquí
  total_parcelas: number;
  mult_tier: number;
  pasaporte_nivel: number;
  renta_diaria: number;
  historial_progreso?: Array<{ fecha: string; usd_generado: number; ab_generado: number }>;
}

interface PerfilAnalisis {
  pais: string;
  moneda: string;
  comunes: number;
  raras: number;
  epicas: number;
  legendarias: number;
  insignias: number;
  ab_ahorrados: number;
  horas_boost: number;
  eficiencia: number;
  horas_srb: number;
  tipo_pase: string;
  hora_inicio: string;
  hora_fin: string;
  eficiencia_anuncios: number;
  dia_asistencia: number;
  meta_dolar: number;
  meta_periodo: string;
  total_parcelas: number;
  mult_tier: number;
  pasaporte_nivel: number;
  renta_diaria: number;
}

interface ResultadoAnalisis {
  veredicto: string;
  estado: string;
  alertas: string[];
  metricas: Record<string, number | string>;
  recomendaciones: string[];
  advertencias: string[];
  proyecciones: Record<string, string>;
  tabla_comparativa: Record<string, string>;
}

function calcularMetaDiaria(meta: number, periodo: string): number {
  if (periodo === "month") return meta / 30;
  if (periodo === "year") return meta / 365;
  return meta;
}

function evaluarTier(total: number): { nivel: string; alerta: boolean; detalle: string } {
  const TIERS = [0, 40, 60, 80, 100, 120, 150, 200, 220, 250, 280, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 1000, 1100, 1200, 1300, 1400, 1500];
  let tramoActual = 0;
  let siguienteTramo = 0;
  for (let i = 0; i < TIERS.length; i++) {
    if (total >= TIERS[i] && (i + 1 >= TIERS.length || total < TIERS[i + 1])) {
      tramoActual = TIERS[i];
      siguienteTramo = i + 1 < TIERS.length ? TIERS[i + 1] : Infinity;
      break;
    }
  }
  const faltantes = siguienteTramo > total ? siguienteTramo - total : 0;
  const alerta = faltantes > 0 && faltantes <= 10;
  return {
    nivel: `${tramoActual} → ${siguienteTramo === Infinity ? "Max" : siguienteTramo} (faltan ${faltantes})`,
    alerta,
    detalle: alerta ? `⚠️ ¡ZONA DE COLAPSO! Solo te faltan ${faltantes} parcelas. No compres individualmente.` : `🏆 Tier estable. Faltan ${faltantes} para el siguiente salto.`
  };
}

function analisisProfundo(p: PerfilAnalisis): ResultadoAnalisis {
  const alertas: string[] = [];
  const recomendaciones: string[] = [];
  const advertencias: string[] = [];
  const metricas: Record<string, number | string> = {};
  const proyecciones: Record<string, string> = {};
  const tabla_comparativa: Record<string, string> = {};

  // ===== Análisis de Eficiencia =====
  if (p.horas_boost < 18) {
    alertas.push(`⏰ Solo ${p.horas_boost}h de boost — ideal mínimo 18h.`);
    recomendaciones.push("📈 Aumenta tus horas de boost a 18-22h para maximizar renta.");
  }
  if (p.eficiencia < 90) {
    alertas.push(`🎯 Efectividad al ${p.eficiencia}% — debería estar sobre 90%.`);
    recomendaciones.push("🎯 Mejora tu efectividad de boost al 90%+ (no dejes que se apague).");
  }
  if (p.horas_srb >= 80) {
    recomendaciones.push("🚀 Excelente participación en SRB. Considera rotar boost en SRB.");
  }

  // ===== Análisis de Composición =====
  const total = p.total_parcelas;
  const pctComunes = (p.comunes / total) * 100;
  const pctRaras = (p.raras / total) * 100;
  const pctEpicas = (p.epicas / total) * 100;
  const pctLegendarias = (p.legendarias / total) * 100;
  metricas["Composición"] = `C:${pctComunes.toFixed(0)}% R:${pctRaras.toFixed(0)}% E:${pctEpicas.toFixed(0)}% L:${pctLegendarias.toFixed(0)}%`;
  if (pctLegendarias >= 10) recomendaciones.push("💎 Buena proporción de legendarias. Sigue así.");
  if (pctComunes > 70) recomendaciones.push("🔄 Demasiadas comunes — considera fusionar en eventos para subir rareza.");

  // ===== Análisis de Pasaporte =====
  const nivelPasaporte = p.pasaporte_nivel;
  const insignias = p.insignias;
  const NIVELES_INSIGNIAS: Record<number, number> = { 0: 0, 1: 10, 2: 30, 3: 60, 4: 100, 5: 200 };
  if (nivelPasaporte < 5) {
    const sigNivel = nivelPasaporte + 1;
    const req = NIVELES_INSIGNIAS[sigNivel] || 101;
    const faltantes = Math.max(0, req - insignias);
    const costoAb = faltantes * 200;
    metricas["Próximo Pasaporte"] = `Nivel ${sigNivel} (faltan ${faltantes} insignias = ${costoAb.toLocaleString()} AB)`;
    if (faltantes > 0 && nivelPasaporte < 3) {
      recomendaciones.push(`🛂 Prioriza insignias: te faltan ${faltantes} para Nivel ${sigNivel} (${costoAb.toLocaleString()} AB).`);
    }
    tabla_comparativa[`Pasaporte N${sigNivel}`] = `+5% renta total | ${costoAb.toLocaleString()} AB | —`;
  }

  // ===== Análisis de Meta =====
  const metaDiaria = calcularMetaDiaria(p.meta_dolar, p.meta_periodo);
  const rentaActual = p.renta_diaria;
  const pctMeta = Math.min(100, (rentaActual / metaDiaria) * 100);
  metricas["Progreso Meta"] = `${pctMeta.toFixed(1)}%`;
  if (rentaActual >= metaDiaria) {
    recomendaciones.push("🎯 ¡META ALCANZADA! Considera aumentar tu objetivo ahora.");
  } else {
    advertencias.push(`📉 Faltas ${(100 - pctMeta).toFixed(0)}% para tu meta de $${metaDiaria.toFixed(4)}/día.`);
    recomendaciones.push(`🎯 Te faltan ${(100 - pctMeta).toFixed(0)}% para tu meta. Sigue farmeando y saltando Tiers.`);
  }

  // ===== Proyecciones =====
  proyecciones["Renta Mensual (Estimada)"] = `$${(rentaActual * 30).toFixed(4)} USD`;
  proyecciones["Renta Anual (Estimada)"] = `$${(rentaActual * 365).toFixed(4)} USD`;
  const abDiariosEstimados = p.ab_ahorrados > 0 ? p.ab_ahorrados / 30 : 50;
  const parcelasPorMes = Math.floor(abDiariosEstimados * 30 / 100);
  proyecciones["Parcelas/mes (Estimado)"] = `${parcelasPorMes}`;
  const rentaFutura = rentaActual + (parcelasPorMes * p.mult_tier * 0.00000000175 * 3600 * 24);
  proyecciones["Renta en 30 días (Estimada)"] = `$${rentaFutura.toFixed(4)} USD`;

  // ===== Veredicto =====
  let veredicto = "";
  let estado = "";
  if (pctMeta >= 100) { veredicto = "🎯 META ALCANZADA — Estás generando suficiente renta. ¡Aumenta tu meta!"; estado = "EXCELENTE"; }
  else if (pctMeta >= 75) { veredicto = `🔥 Vas por buen camino. Estás al ${pctMeta.toFixed(0)}% de tu meta.`; estado = "BUENO"; }
  else if (pctMeta >= 50) { veredicto = `📈 Progreso sólido (${pctMeta.toFixed(0)}% de meta). Sigue así.`; estado = "REGULAR"; }
  else { veredicto = `🌱 Estás comenzando o necesitas acelerar (${pctMeta.toFixed(0)}% de meta).`; estado = "TEMPRANO"; }

  const tierInfo = evaluarTier(total);
  if (tierInfo.alerta) {
    alertas.push(tierInfo.detalle);
    advertencias.push(tierInfo.detalle);
    veredicto = `🚨 🚨 ${veredicto} · ¡Y ESTÁS EN ZONA DE COLAPSO! Ahorra antes de comprar. 🚨 🚨`;
  }

  // ===== Tabla comparativa F2P vs EC =====
  const bonusEc = abDiariosEstimados * 0.6;
  tabla_comparativa["F2P Actual"] = `${abDiariosEstimados.toFixed(0)} AB/día | Sin costo | ${parcelasPorMes} parcelas/mes`;
  tabla_comparativa["Explorer Club"] = `${(abDiariosEstimados + bonusEc).toFixed(0)} AB/día | $50/mes | ${Math.floor((abDiariosEstimados + bonusEc) * 30 / 100)} parcelas/mes`;

  return { veredicto, estado, alertas, metricas, recomendaciones, advertencias, proyecciones, tabla_comparativa };
}

// ============================================
// 3. FORMATO HTML PROFESIONAL
// ============================================

function formatearHTML(r: ResultadoAnalisis, p: PerfilAnalisis, metaDiaria: number): string {
  const partes: string[] = [];
  partes.push(`<div class="space-y-4 text-sm leading-relaxed">`);

  const colorHeader = r.estado === "EXCELENTE" ? "from-green-900/40 to-emerald-900/20 border-green-500/20"
    : r.estado === "BUENO" ? "from-cyan-900/40 to-blue-900/20 border-cyan-500/20"
    : r.estado === "REGULAR" ? "from-yellow-900/40 to-orange-900/20 border-yellow-500/20"
    : "from-purple-900/40 to-indigo-900/20 border-purple-500/20";

  partes.push(`
    <div class="p-4 bg-gradient-to-r ${colorHeader} rounded-xl border">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg">${r.estado === "EXCELENTE" ? "🏆" : r.estado === "BUENO" ? "🔥" : r.estado === "REGULAR" ? "📈" : "🌱"}</span>
        <span class="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Estado: ${r.estado}</span>
      </div>
      <div class="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">${r.veredicto}</div>
    </div>
  `);

  if (r.alertas.length > 0) {
    partes.push(`<div class="space-y-1">`);
    for (const a of r.alertas) {
      partes.push(`<div class="text-red-400 bg-red-900/20 p-2 rounded-lg border border-red-500/20 text-sm">${a}</div>`);
    }
    partes.push(`</div>`);
  }

  if (Object.keys(r.metricas).length > 0) {
    partes.push(`<div class="grid grid-cols-2 gap-2">`);
    for (const [k, v] of Object.entries(r.metricas)) {
      partes.push(`<div class="p-2.5 bg-[#0a0a0a] rounded-lg border border-white/5 text-sm"><div class="text-[10px] text-gray-500">${k}</div><div class="font-bold text-white">${v}</div></div>`);
    }
    partes.push(`</div>`);
  }

  if (Object.keys(r.proyecciones).length > 0) {
    partes.push(`<div class="mt-3"><div class="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">🔮 Proyecciones</div><div class="grid grid-cols-1 sm:grid-cols-2 gap-2">`);
    for (const [k, v] of Object.entries(r.proyecciones)) {
      partes.push(`<div class="p-2.5 bg-[#0a0a0a] rounded-lg border border-white/5 text-sm"><div class="text-[10px] text-gray-500">${k}</div><div class="font-bold text-white">${v}</div></div>`);
    }
    partes.push(`</div></div>`);
  }

  if (Object.keys(r.tabla_comparativa).length > 0) {
    partes.push(`<div class="mb-4"><div class="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">⚖️ Comparativa F2P vs Explorer Club</div><div class="grid grid-cols-1 sm:grid-cols-2 gap-2">`);
    for (const [k, v] of Object.entries(r.tabla_comparativa)) {
      const parts = v.split("|").map(s => s.trim());
      partes.push(`<div class="p-3 bg-[#0a0a0a] rounded-lg border border-white/5"><div class="font-bold text-sm ${k.includes('Explorer') ? 'text-amber-400' : 'text-green-400'}">${k}</div><div class="text-xs text-gray-400 mt-1">${parts[0]}</div><div class="text-xs text-gray-400">📦 ${parts[1]}</div><div class="text-xs text-gray-300 mt-1">⏱️ ${parts[2] || '—'}</div></div>`);
    }
    partes.push(`</div></div>`);
  }

  const eficienciaBoost = (p.horas_boost / 24) * (p.eficiencia / 100) * 100;
  const horasOptimas = p.horas_boost >= 18 && p.horas_boost <= 22;
  const eficienciaOptima = p.eficiencia >= 90;
  partes.push(`<div class="mt-4 p-3 bg-[#0e0e0e] rounded-lg border border-white/5"><div class="text-[10px] text-gray-500 uppercase tracking-widest mb-2">⚡ Diagnóstico de Eficiencia</div><div class="space-y-1.5 text-sm">
    <div class="flex justify-between"><span class="text-gray-400">Horas de Boost:</span><span class="font-bold ${horasOptimas ? 'text-green-400' : 'text-orange-400'}">${p.horas_boost}h/día ${horasOptimas ? '✅' : '⚠️ (ideal 18-22h)'}</span></div>
    <div class="flex justify-between"><span class="text-gray-400">Efectividad:</span><span class="font-bold ${eficienciaOptima ? 'text-green-400' : 'text-orange-400'}">${p.eficiencia}% ${eficienciaOptima ? '✅' : '⚠️ (ideal >90%)'}</span></div>
    <div class="flex justify-between"><span class="text-gray-400">Eficiencia Total:</span><span class="font-bold text-cyan-400">${eficienciaBoost.toFixed(0)}%</span></div>
    <div class="flex justify-between"><span class="text-gray-400">Horas SRB/mes:</span><span class="font-bold text-yellow-400">${p.horas_srb}h</span></div>
  </div></div>`);

  partes.push(`<div class="mt-6 pt-4 border-t border-white/5 text-center text-[10px] text-gray-600">Generado por <strong>Atlas Earth PRO AI</strong> · Datos calculados con tu perfil actual · Recarga para actualizar</div></div>`);
  return partes.join("\n");
}

// ============================================
// 4. SERVER — Edge Function Principal con JWT Validation
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: PayloadAnalisis = await req.json();

    const requiredFields: (keyof PayloadAnalisis)[] = [
      'user_id', 'pais', 'comunes', 'raras', 'epicas', 'legendarias',
      'insignias', 'ab_ahorrados', 'horas_boost', 'eficiencia',
      'horas_srb', 'tipo_pase', 'hora_inicio', 'hora_fin',
      'eficiencia_anuncios', 'dia_asistencia', 'meta_dolar', 'meta_periodo',
      'total_parcelas', 'mult_tier', 'pasaporte_nivel', 'renta_diaria'
    ];

    for (const field of requiredFields) {
      if (payload[field] === undefined || payload[field] === null) {
        return new Response(JSON.stringify({ error: `Campo requerido faltante: ${field}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
        })
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // ===== VALIDACIÓN JWT + OBTENER USUARIO =====
    let userId = payload.user_id;
    const authHeader = req.headers.get('Authorization') || '';

    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (!authError && user) userId = user.id;
      } catch { console.warn("JWT validation failed, user_id from payload"); }
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
    }

    if (!is_ultra && ai_credits <= 0) {
      return new Response(JSON.stringify({
        error: "Acceso bloqueado. Para usar la IA de forma gratuita, apoya el proyecto invitando un café (desbloquea 3 consultas automáticas)."
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
    }

    // ================================================
    // 5. EJECUTAR ANÁLISIS CON DATOS PRE-COMPUTADOS
    // ================================================

    const perfil: PerfilAnalisis = {
      pais: payload.pais, moneda: payload.moneda || "USD",
      comunes: payload.comunes, raras: payload.raras, epicas: payload.epicas, legendarias: payload.legendarias,
      insignias: payload.insignias, ab_ahorrados: payload.ab_ahorrados,
      horas_boost: payload.horas_boost, eficiencia: payload.eficiencia, horas_srb: payload.horas_srb,
      tipo_pase: payload.tipo_pase, hora_inicio: payload.hora_inicio, hora_fin: payload.hora_fin,
      eficiencia_anuncios: payload.eficiencia_anuncios, dia_asistencia: payload.dia_asistencia,
      meta_dolar: payload.meta_dolar, meta_periodo: payload.meta_periodo || "day",
      total_parcelas: payload.total_parcelas, mult_tier: payload.mult_tier,
      pasaporte_nivel: payload.pasaporte_nivel, renta_diaria: payload.renta_diaria,
    };

    const metaDiaria = calcularMetaDiaria(perfil.meta_dolar, perfil.meta_periodo);
    const resultado = analisisProfundo(perfil);

    // Intentar Morph LLM
    const morphApiKey = Deno.env.get("MORPH_API_KEY");
    let aiAdvice = "";
    let usedFallback = true;

    if (morphApiKey) {
      try {
        const morphResponse = await fetch("https://api.morphllm.com/v1/chat/completions", {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${morphApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: "morph-v3-fast",
            messages: [
              { role: "system", content: `Eres el 'Analista Financiero Jefe' de Atlas Earth, experto en economías de juegos móviles. Tu función es DAR CONSEJOS ULTRAPRECISOS basados en datos matemáticos. REGLAS ESTRICTAS: 1. Responde SOLO en español, lenguaje claro y directo 2. NO saludes con "Hola", "Bienvenido", etc. 3. NO repitas los datos que ya te pasé 4. Usa negritas con <strong> para cifras clave 5. Máximo 4 párrafos cortos 6. El primer párrafo debe ser el veredicto principal 7. El último párrafo debe ser una frase motivacional agresiva y corta 8. Si el usuario está en zona de colapso de Tier, el veredicto debe ser DRAMÁTICO` },
              { role: "user", content: `ANALIZA MI CUENTA DE ATLAS EARTH (DATOS PRE-COMPUTADOS):\n📍 PAÍS: ${perfil.pais}\n📦 TOTAL PARCELAS: ${perfil.total_parcelas} (${perfil.comunes}C ${perfil.raras}R ${perfil.epicas}E ${perfil.legendarias}L)\n🛂 PASAPORTE: Nivel ${perfil.pasaporte_nivel} (+${perfil.pasaporte_nivel * 5}%) (${perfil.insignias} insignias)\n🔢 MULTIPLICADOR: ${perfil.mult_tier}x\n💰 RENTA DIARIA: $${perfil.renta_diaria.toFixed(7)} USD\n💎 AB AHORRADOS: ${perfil.ab_ahorrados.toLocaleString()}\n⏰ BOOST: ${perfil.horas_boost}h/día | EFECTIVIDAD: ${perfil.eficiencia}%\n🚀 SRB: ${perfil.horas_srb}h/mes\n💎 PASE: ${perfil.tipo_pase}\n🎯 META: $${metaDiaria} USD/día\n\nDAME: 1. Veredicto Principal 2. Análisis de Riesgo 3. Recomendación Optimizada 4. Frase Motivacional` }
            ],
            temperature: 0.5, max_tokens: 400,
          })
        });
        if (morphResponse.ok) {
          const morphData = await morphResponse.json();
          if (morphData.choices?.[0]?.message?.content) {
            aiAdvice = morphData.choices[0].message.content;
            usedFallback = false;
          }
        }
      } catch { console.warn("Morph LLM falló, usando análisis local"); }
    }

    if (!is_ultra && !usedFallback) {
      await supabase.from('usuarios_atlas').update({ ai_credits: ai_credits - 1 }).eq('user_id', userId);
      ai_credits -= 1;
    }

    let htmlFinal = formatearHTML(resultado, perfil, metaDiaria);

    if (aiAdvice && !usedFallback) {
      htmlFinal = htmlFinal.replace(
        '<div class="flex items-center gap-2 mb-2">',
        `<div class="mb-4 p-4 bg-gradient-to-r from-cyan-900/30 to-blue-900/20 rounded-xl border border-cyan-500/20">
          <div class="text-[10px] text-gray-500 uppercase tracking-widest mb-2">🤖 Consejo de IA Generativa</div>
          <div class="text-sm leading-relaxed">${aiAdvice.replace(/\n/g, '<br/>')}</div>
        </div>
        <div class="flex items-center gap-2 mb-2">`
      );
    }

    return new Response(JSON.stringify({
      advice: htmlFinal,
      remaining_credits: is_ultra ? "Ilimitados (ULTRA)" : (usedFallback ? "Ilimitados (Motor Local)" : ai_credits),
      source: usedFallback ? "local" : "morph+local",
      metricas: resultado.metricas, advertencias: resultado.advertencias, recomendaciones: resultado.recomendaciones,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (err) {
    console.error("Internal Edge Error:", err)
    const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
    return new Response(JSON.stringify({ error: errorMsg || "Error desconocido en el servidor" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    })
  }
})
