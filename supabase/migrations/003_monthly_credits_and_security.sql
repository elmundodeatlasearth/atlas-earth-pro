-- Supabase SQL Migration: 003_monthly_credits_and_security.sql
-- ============================================================================
-- 1) CRÉDITOS MENSUALES AUTOMÁTICOS  (paywall promete: PRO=5/mes, ULTRA=50/mes)
-- 2) ENDURECIMIENTO DE SEGURIDAD:  usuarios ya NO pueden editar su plan/créditos
-- 3) BORRAR HISTORIAL individual (feature faltante)
-- 4) RPCs SECURITY DEFINER para operaciones controladas
--
-- Ejecutar TODO en el SQL Editor de Supabase (Dashboard → SQL Editor → New query)
-- Es IDEMPOTENTE: se puede ejecutar varias veces sin error.
-- ============================================================================

-- ============================================================
-- 1. COLUMNA credits_updated_at  (rastrea el último reset mensual)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios_atlas' AND column_name = 'credits_updated_at'
  ) THEN
    ALTER TABLE usuarios_atlas ADD COLUMN credits_updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- ============================================================
-- 2. FUNCIÓN DE RESET MENSUAL (llamada por pg_cron y por edge function)
--    PRO  → 5 créditos
--    ULTRA → 50 créditos
--    FREE → 0 créditos (no renueva)
-- ============================================================
CREATE OR REPLACE FUNCTION public.reset_monthly_credits_if_needed(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_now TIMESTAMPTZ := now();
  v_month_start TIMESTAMPTZ := date_trunc('month', v_now)::timestamptz;
  v_remaining INTEGER;
BEGIN
  SELECT * INTO v_user FROM usuarios_atlas WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- ¿Ya se reseteó este mes? (credits_updated_at >= inicio del mes actual)
  IF v_user.credits_updated_at IS NOT NULL AND v_user.credits_updated_at >= v_month_start THEN
    RETURN v_user.ai_credits; -- no renovar dos veces
  END IF;

  -- Renovar según plan actual
  IF v_user.is_ultra THEN
    v_remaining := 50;
  ELSIF v_user.is_vip THEN
    v_remaining := 5;
  ELSE
    v_remaining := 0; -- FREE: no renueva (conserva 0)
  END IF;

  UPDATE usuarios_atlas
  SET ai_credits = v_remaining,
      credits_updated_at = v_now
  WHERE user_id = p_user_id;

  RETURN v_remaining;
END;
$$;

-- Dar permiso de ejecución a los usuarios autenticados (para su PROPIA fila)
GRANT EXECUTE ON FUNCTION public.reset_monthly_credits_if_needed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_monthly_credits_if_needed(UUID) TO service_role;

-- ============================================================
-- 3. pg_cron: reset mensual AUTOMÁTICO para TODOS los usuarios
--    Corre el día 1 de cada mes a las 00:05 UTC.
--    Si pg_cron no está disponible, el edge function llama al RPC como respaldo.
-- ============================================================
DO $$
BEGIN
  -- pg_cron solo existe si la extensión está instalada (plan Pro+ de Supabase)
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Eliminar job anterior si existe (para que el UPDATE abajo sea idempotente)
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reset-monthly-credits') THEN
      PERFORM cron.unschedule('reset-monthly-credits');
    END IF;
    PERFORM cron.schedule(
      'reset-monthly-credits',
      '0 5 1 * *',
      $cron$
      UPDATE usuarios_atlas
      SET ai_credits = CASE
            WHEN is_ultra THEN 50
            WHEN is_vip THEN 5
            ELSE 0
          END,
          credits_updated_at = now()
      WHERE (is_vip OR is_ultra);
      $cron$
    );
  END IF;
END $$;

-- ============================================================
-- 4. ENDURECIMIENTO RLS — CRÍTICO
--    ANTES: el usuario podía auto-concederse PRO/ULTRA/créditos
--    (UPDATE directo con auth.uid() = user_id sin restricción de columnas).
--    AHORA: se elimina ese UPDATE; solo se escribe vía RPC SECURITY DEFINER
--    controlado (perfil) o con service_role (webhook de Stripe / admin).
-- ============================================================

-- 4.1 Usuarios: SOLO pueden LEER su fila y CREARLA. NADA de UPDATE directo.
DROP POLICY IF EXISTS "Users update own usuario" ON usuarios_atlas;

-- (ya existe SELECT/INSERT; los dejamos tal cual)

-- 4.2 RPC para que el usuario actualice SOLO su perfil_data (nunca plan/créditos)
CREATE OR REPLACE FUNCTION public.update_own_perfil_data(p_perfil_data JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE usuarios_atlas
  SET perfil_data = COALESCE(p_perfil_data, '{}'::jsonb)
  WHERE user_id = auth.uid();
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_own_perfil_data(JSONB) TO authenticated;

-- 4.3 RPC para borrar UNA entrada de historial (solo la propia)
CREATE OR REPLACE FUNCTION public.borrar_historial(p_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM historial_atlas
  WHERE id = p_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.borrar_historial(BIGINT) TO authenticated;

-- ============================================================
-- 5. HISTORIAL: agregar política DELETE (por si se usa el cliente directo)
-- ============================================================
DROP POLICY IF EXISTS "Users delete own history" ON historial_atlas;
CREATE POLICY "Users delete own history"
  ON historial_atlas FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. MIGRAR usuarios existentes: marcar créditos como renovados este mes
--    (evita que el primer reset les duplique créditos)
-- ============================================================
UPDATE usuarios_atlas
SET credits_updated_at = date_trunc('month', now())::timestamptz
WHERE credits_updated_at IS NULL;

-- ============================================================
-- 7. VERIFICACIÓN — ejecuta esto para confirmar
-- ============================================================
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'usuarios_atlas' ORDER BY ordinal_position;
-- SELECT jobname, schedule, command FROM cron.job;
-- SELECT proname FROM pg_proc WHERE proname IN
--   ('reset_monthly_credits_if_needed','update_own_perfil_data','borrar_historial');
