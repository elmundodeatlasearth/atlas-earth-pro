// supabase/functions/admin-list-users/index.ts
// Edge Function para CRUD del CRM — usa service_role para bypass RLS
// GET  /admin-list-users?page=&limit=  → lista usuarios (solo admin)
// POST /admin-list-users              → mutaciones {action, user_id, amount?}
//   action: "add_credits" | "toggle_vip" | "set_ultra" | "remove_ultra"
// Solo accesible por usuarios con rol "admin" en auth.user_metadata
//
// v2: JOIN con auth.users para traer el email real + parseo de perfil_data
//     (total_parcelas, meta_dolares) — antes la UI mostraba columnas inexistentes.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Rate limiter persistente (migración 004) — admin: 30 req/min
// Con fallback in-memory si el RPC no está disponible.
const ADMIN_RATE_LIMIT = 30;
const localMap = new Map<string, { count: number; resetAt: number }>();

async function checkAdminRateLimit(
  key: string,
  supabase: ReturnType<typeof createClient>,
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: key,
      p_limit: ADMIN_RATE_LIMIT,
      p_window_s: 60,
    });
    if (!error && data && Array.isArray(data) && data.length > 0) {
      return (data[0] as { allowed: boolean }).allowed;
    }
    if (error) console.warn('Admin rate limit RPC falló:', error.message);
  } catch (e) {
    console.warn('Admin rate limit RPC excepción:', String(e));
  }
  // Fallback local
  const now = Date.now();
  const entry = localMap.get(key);
  if (!entry || now > entry.resetAt) {
    localMap.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  entry.count++;
  return entry.count <= ADMIN_RATE_LIMIT;
}

/** Extrae total_parcelas y meta_dolares del JSONB perfil_data (formato texto) */
function computarDesdePerfil(perfilData: unknown): { total_parcelas: number; meta_dolares: number } {
  const p = (perfilData && typeof perfilData === "object" ? perfilData : {}) as Record<string, unknown>;
  const total =
    Number(p.total_parcelas ?? 0) ||
    Number(p.c_comun ?? 0) + Number(p.c_rara ?? 0) + Number(p.c_epica ?? 0) + Number(p.c_legendaria ?? 0);
  return {
    total_parcelas: Number.isFinite(total) ? total : 0,
    meta_dolares: Number.isFinite(Number(p.meta_dolar)) ? Number(p.meta_dolar) : 0,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Token requerido' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
      });
    }

    // Verificar rol admin
    const role = user.user_metadata?.role || user.app_metadata?.role || "";
    if (role !== "admin") {
      return new Response(JSON.stringify({ error: 'No tienes permisos de administrador' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      });
    }

    // ===== RATE LIMIT (anti-abuso) =====
    const allowed = await checkAdminRateLimit(user.id, supabase);
    if (!allowed) {
      return new Response(JSON.stringify({ error: '⏳ Demasiadas solicitudes. Espera un minuto.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429,
      });
    }

    // ===== MUTACIONES (POST) =====
    if (req.method === 'POST') {
      let body: Record<string, unknown> = {};
      try { body = await req.json(); } catch { /* body vacío */ }

      const action = String(body.action || "");
      const targetUserId = String(body.user_id || "");
      if (!action || !targetUserId) {
        return new Response(JSON.stringify({ error: 'action y user_id requeridos' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
        });
      }

      try {
        if (action === "add_credits") {
          const amount = Math.max(1, Math.floor(Number(body.amount) || 0));
          await supabase.rpc("increment_ai_credits", { p_user_id: targetUserId, p_amount: amount });
        } else if (action === "toggle_vip") {
          const { data: target } = await supabase
            .from('usuarios_atlas').select('is_vip, is_ultra').eq('user_id', targetUserId).single();
          const isUltra = !!target?.is_ultra;
          const newVip = !target?.is_vip;
          if (!isUltra) {
            await supabase.from('usuarios_atlas').update({ is_vip: newVip }).eq('user_id', targetUserId);
          }
        } else if (action === "set_ultra") {
          await supabase.from('usuarios_atlas')
            .update({ is_ultra: true, is_vip: true, ai_credits: 50 })
            .eq('user_id', targetUserId);
        } else if (action === "remove_ultra") {
          await supabase.from('usuarios_atlas')
            .update({ is_ultra: false, is_vip: false })
            .eq('user_id', targetUserId);
        } else {
          return new Response(JSON.stringify({ error: `Acción desconocida: ${action}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
          });
        }
      } catch (mutErr) {
        console.error("Admin mutation error:", mutErr);
        return new Response(JSON.stringify({ error: mutErr instanceof Error ? mutErr.message : 'Error en mutación' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    // ===== LISTADO (GET) =====
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const { data: users, error: usersError, count } = await supabase
      .from('usuarios_atlas')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (usersError) {
      return new Response(JSON.stringify({ error: usersError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
      });
    }

    // ===== ENRIQUECER con email (auth.users) + perfil computado =====
    // auth.users NO es accesible vía PostgREST; usamos la API de Admin de GoTrue
    const emails = new Map<string, string>();
    try {
      const ids = (users || []).map((u: Record<string, unknown>) => String(u.user_id));
      if (ids.length > 0) {
        const { data: authUsers, error: auError } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        if (!auError && authUsers?.users) {
          for (const au of authUsers.users) {
            const found = ids.find(id => id === au.id);
            if (found) emails.set(found, au.email || "");
          }
        }
      }
    } catch (e) {
      console.warn("No se pudo enriquecer emails:", String(e));
    }

    // Mapear la respuesta a lo que espera la UI (con datos reales)
    const enriched = (users || []).map((u: Record<string, unknown>) => {
      const perfil = computarDesdePerfil(u.perfil_data);
      return {
        user_id: u.user_id,
        email: emails.get(String(u.user_id)) || "",
        is_vip: !!u.is_vip,
        is_ultra: !!u.is_ultra,
        ai_credits: u.ai_credits ?? 0,
        total_parcelas: perfil.total_parcelas,
        meta_dolares: perfil.meta_dolares,
        created_at: u.created_at,
      };
    });

    return new Response(JSON.stringify({
      users: enriched,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error("Admin list error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});
