# Supabase SQL Editor — Guía de Aplicación de Migraciones
# ============================================================================
# Sin necesidad de CLI. Solo navegador.
# ============================================================================

## ✅ PASO 1 — Abrir el SQL Editor
# 1. Ve a: https://supabase.com/dashboard → proyecto yzykfkuoievdwqccyjtc
# 2. Menú lateral → SQL Editor → New query
# 3. Pegar TODO el contenido del archivo y ejecutar.

## ✅ PASO 2 — Ejecutar en orden (IMPORTANTE)
#
#   1) supabase/migrations/001_init.sql
#      → crea tablas usuarios_atlas + historial_atlas + RLS básico
#      (si tu proyecto ya fue creado antes, puede dar "already exists" — es seguro)
#
#   2) supabase/migrations/002_fix_rls_and_schema.sql
#      → renombra perfil_data, triggers, RLS correcto, 3 créditos al registrarse
#
#   3) supabase/migrations/003_monthly_credits_and_security.sql  ← NUEVO
#      → créditos mensuales PRO=5/ULTRA=50 + endurece seguridad:
#        - el usuario YA NO puede editar is_vip/is_ultra/ai_credits
#        - RPCs seguros: update_own_perfil_data, borrar_historial
#        - reset mensual automático (pg_cron si está disponible)
#
#   4) supabase/migrations/004_persistent_rate_limiting.sql  ← NUEVO
#      → rate limiting PERSISTENTE para edge functions (anti-abuso):
#        - tabla rate_limits + RPC atómico check_rate_limit
#        - sobrevive cold starts (el Map in-memory se reiniciaba)
#        - limpieza automática diaria (pg_cron si está disponible)

## 🛡️ POR QUÉ ES CRÍTICO EL PASO 3 (seguridad)
# ANTES: cualquier usuario logueado podía hacer:
#   UPDATE usuarios_atlas SET is_ultra=true WHERE user_id=su_id;
#   → ¡auto-concederse ULTRA gratis!
# DESPUÉS: esa política UPDATE se elimina. Solo el webhook (service_role)
# y el admin (edge function) pueden cambiar planes.

## 🛡️ POR QUÉ ES CRÍTICO EL PASO 4 (rate limiting)
# SIN él: un atacante podía llamar a la IA 200 veces seguidas rotando
# instancias serverless (el contador in-memory se reinicia en cada cold start).
# CON él: el contador vive en Postgres y persiste entre instancias.

## 🧪 VERIFICAR TRAS EJECUTAR (ejecuta esto en otra query)
-- 1) Columnas nuevas
SELECT column_name FROM information_schema.columns
WHERE table_name = 'usuarios_atlas' ORDER BY ordinal_position;

-- 2) Funciones RPC creadas
SELECT proname FROM pg_proc
WHERE proname IN ('reset_monthly_credits_if_needed','update_own_perfil_data','borrar_historial','check_rate_limit');

-- 3) pg_cron job (si tu plan lo soporta)
SELECT jobname, schedule, command FROM cron.job;

-- 4) Política UPDATE eliminada (no debe aparecer)
SELECT policyname FROM pg_policies
WHERE tablename = 'usuarios_atlas' AND cmd = 'UPDATE';

-- 5) Rate limiter funcionando (debe devolver: allowed=true, remaining=9)
SELECT * FROM public.check_rate_limit('00000000-0000-0000-0000-000000000000', 10, 60);

## ⚠️ NOTAS
# - Duplicar migraciones es seguro (todas son idempotentes).
# - Si usas el CLI: `supabase db push` hace esto automáticamente
#   (después de `supabase link`).
# - La extensión pg_cron solo existe en planes Pay-As-You-Go de Supabase.
#   Si no está disponible, NO pasa nada: la edge function ai-advisor llama
#   al RPC reset_monthly_credits_if_needed como respaldo en cada uso de IA.
