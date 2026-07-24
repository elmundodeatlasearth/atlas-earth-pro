import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generador de estrategia local (fallback cuando Morph LLM no está disponible)
function generarEstrategiaLocal(parcelas: number, ab_diarios: number, ab_ahorrados: number, meta_diaria: number, dia_optimo_pase: number): string {
  const parcelas_posibles = Math.floor(ab_ahorrados / 100);
  const dias_para_meta = meta_diaria > 0 ? Math.ceil((meta_diaria * 100000) / Math.max(ab_diarios, 1)) : 999;
  
  let consejos: string[] = [];
  
  // Consejo 1: Sobre parcelas vs ahorro
  if (parcelas_posibles >= 50) {
    consejos.push(`💎 <strong>Tienes ${ab_ahorrados} AB ahorrados</strong> (${parcelas_posibles} parcelas posibles). Antes de comprar, verifica en la Tabla de Saltos si cruzarás un Tier. Si tu multiplicador bajaría, <strong>NO compres</strong> y ahorra hasta poder saltar al siguiente Tier completo.`);
  } else if (parcelas_posibles >= 10) {
    consejos.push(`📊 Con tus ${ab_ahorrados} AB puedes comprar ${parcelas_posibles} parcelas. Revisa si esto te haría cruzar un Tier en la tabla de abajo — si el multiplicador baja, es mejor esperar.`);
  } else {
    consejos.push(`🌱 Tus ${ab_ahorrados} AB aún no alcanzan para un salto significativo. Sigue farmeando anuncios consistentemente — cada día de constancia te acerca a tu meta.`);
  }
  
  // Consejo 2: Sobre el Pase Explorer
  consejos.push(`🏆 <strong>Pase Explorer Club ($50):</strong> Si decides comprarlo, el momento matemáticamente ÓPTIMO es el <strong>Día ${dia_optimo_pase}</strong> de tu racha de asistencia. Ahí tu ventana de 30 días capturará los mejores bonos automáticamente.`);
  
  // Consejo 3: Motivacional
  if (ab_diarios >= 100) {
    consejos.push(`🔥 Estás generando <strong>${ab_diarios.toFixed(0)} AB al día</strong> — eso es un ritmo sólido. Con disciplina y sin compras impulsivas, llegarás a tu meta de $${meta_diaria}/día. ¡La constancia es tu superpoder!`);
  } else {
    consejos.push(`💪 Generas ${ab_diarios.toFixed(0)} AB/día. Cada anuncio que ves es un ladrillo más en tu imperio. No te rindas — los que triunfan en Atlas Earth son los que nunca dejan de farmear. ¡Tú puedes!`);
  }
  
  return consejos.map(c => `<p class="mb-3">${c}</p>`).join('\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

    try {
    const { user_id, parcelas, ab_diarios, ab_ahorrados, meta_diaria, dia_optimo_pase } = await req.json()

    if (!user_id) {
      return new Response(JSON.stringify({ error: "No user_id provided" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const { data: user, error: userError } = await supabase
      .from('usuarios_atlas')
      .select('ai_credits, is_ultra, is_vip')
      .eq('user_id', user_id)
      .single()

    // Si no encontramos al usuario en la BD (a veces el trigger falla o es anon), le damos un fallback seguro
    let ai_credits = 0;
    let is_ultra = false;
    let is_vip = false;

    if (!userError && user) {
        ai_credits = user.ai_credits == null ? 0 : user.ai_credits;
        is_ultra = user.is_ultra;
        is_vip = user.is_vip;
    }

    if (!is_ultra && ai_credits <= 0) {
      return new Response(JSON.stringify({ 
        error: "Acceso bloqueado. Para usar la IA de forma gratuita, apoya el proyecto invitando un café (desbloquea 3 consultas automáticas)." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    const morphApiKey = Deno.env.get("MORPH_API_KEY")
    
    let aiAdvice = "";
    let usedFallback = false;

    if (morphApiKey) {
      // 1. MORPH REFLEX: Escudo de seguridad (Pre-flight) — OPCIONAL
      // Si falla por cuota o cualquier error, simplemente lo saltamos
      try {
        const reflexResponse = await fetch("https://api.morphllm.com/v1/reflex/predict", {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${morphApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "jailbreak",
            text: `Parcelas: ${parcelas}, AB: ${ab_ahorrados}`
          })
        })

        if (reflexResponse.ok) {
          const reflexData = await reflexResponse.json();
          if (reflexData.selected) {
            return new Response(JSON.stringify({ 
              error: "Lo siento, como Analista Financiero de Atlas Earth, mis protocolos de seguridad han bloqueado tu solicitud. Por favor mantén el enfoque exclusivamente en tu portafolio." 
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 403,
            })
          }
        }
        // Si Reflex falla (402, 429, 500, etc.), simplemente continuamos sin seguridad Reflex
      } catch (_reflexErr) {
        console.warn("Morph Reflex no disponible, continuando sin verificación:", _reflexErr);
      }

      // 2. MORPH LLM: Generar consejo — con fallback local si falla
      try {
        const modelo_optimizado = "morph-v3-fast"
        const morphResponse = await fetch("https://api.morphllm.com/v1/chat/completions", {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${morphApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelo_optimizado,
            messages: [
              { role: "user", content: `Actúa como Analista Financiero Jefe de Atlas Earth. Eres un experto en dar consejos estratégicos y motivacionales sobre el juego.

Tengo los siguientes recursos:
- Parcelas actuales: ${parcelas}
- Generación diaria: ${ab_diarios} Atlas Bucks
- Ahorros actuales: ${ab_ahorrados} AB

Mi meta es: Ganar $${meta_diaria} USD al día.
Dato clave: El MEJOR día para comprar el Pase Explorer Club ($50) es mi Día ${dia_optimo_pase} de racha.

Instrucciones:
1. Dame un consejo directo de 3 viñetas cortas.
2. Dime claramente si debo ahorrar, comprar parcelas ahora mismo, o comprar el Pase (mencionando el día óptimo).
3. Termina con una frase muy motivacional.
4. NO repitas mis datos. No digas "basado en tus datos".

Respuesta:` }
            ],
            temperature: 0.6,
            max_tokens: 350,
            frequency_penalty: 0.8,
            presence_penalty: 0.5
          })
        })

        if (morphResponse.ok) {
          const morphData = await morphResponse.json()
          if (morphData.choices && morphData.choices.length > 0) {
            aiAdvice = morphData.choices[0].message.content
            // Evitar que Morph LLM repita el prompt de usuario
            if (aiAdvice.includes("Respuesta:")) {
              aiAdvice = aiAdvice.split("Respuesta:")[1].trim()
            } else if (aiAdvice.includes("Instrucciones:")) {
              aiAdvice = aiAdvice.split("Instrucciones:")[1].trim()
            }
          } else {
            throw new Error("Respuesta vacía de Morph LLM")
          }
        } else {
          // API de Morph no disponible (402, 429, etc.) — usar fallback local
          console.warn("Morph LLM API no disponible (status " + morphResponse.status + "), usando estrategia local");
          throw new Error("Morph unavailable")
        }
      } catch (_morphErr) {
        console.warn("Morph LLM falló, usando generador local:", _morphErr);
        aiAdvice = generarEstrategiaLocal(parcelas, ab_diarios, ab_ahorrados, meta_diaria, dia_optimo_pase);
        usedFallback = true;
      }
    } else {
      // No hay API key configurada — usar fallback local directamente
      aiAdvice = generarEstrategiaLocal(parcelas, ab_diarios, ab_ahorrados, meta_diaria, dia_optimo_pase);
      usedFallback = true;
    }

    if (!is_ultra && !usedFallback) {
      await supabase
        .from('usuarios_atlas')
        .update({ ai_credits: ai_credits - 1 })
        .eq('user_id', user_id)
      
      ai_credits -= 1
    }

    return new Response(JSON.stringify({ 
      advice: aiAdvice,
      remaining_credits: is_ultra ? "Ilimitados (ULTRA)" : (usedFallback ? "Ilimitados (Motor Local)" : ai_credits),
      source: usedFallback ? "local" : "morph"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    console.error("Internal Edge Error:", err)
    const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
    return new Response(JSON.stringify({ error: errorMsg || "Error desconocido en el servidor" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
