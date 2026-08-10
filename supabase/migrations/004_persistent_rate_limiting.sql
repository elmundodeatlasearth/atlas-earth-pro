-- Supabase SQL Migration: 004_persistent_rate_limiting.sql
-- ============================================================================
-- RATE LIMITING PERSISTENTE para edge functions serverless.
--
-- PROBLEMA: el rate limiter in-memory (Map en JS) se reinicia en cada cold
-- start. Un atacante puede rotar instancias o simplemente esperar a que se
-- enfríe para volver a disparar peticiones.
--
-- SOLUCIÓN: tabla + RPC atómico en Postgres. La ventana se calcula como
-- epoch_minute (timestamp / 60). El RPC hace un INSERT ... ON CONFLICT
-- atómico: si la ventana existe, incrementa; si no, crea. Devuelve
-- allowed / remaining / retry_after en una sola llamada.
--
-- Ejecutar en el SQL Editor de Supabase (Dashboard → SQL Editor → New query).
-- Es IDEMPOTENTE: se puede ejecutar varias veces sin error.
-- ============================================================================

-- ============================================================
-- 1. TABLA rate_limits
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id     UUID NOT NULL,
  window_start BIGINT NOT NULL,  -- epoch en MINUTOS (floor(now()/60))
  count       INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, window_start)
);

-- Índice para limpiar ventanas viejas rápido
CREATE INDEX IF NOT EXISTS idx_rate_limits_window
  ON public.rate_limits (window_start);

-- RLS: nadie puede leer/escribir directamente; solo el RPC (service_role)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- Sin políticas: ni lectura ni escritura para usuarios autenticados.
-- El RPC SECURITY DEFINER (owner) puede leer/escribir.

-- ============================================================
-- 2. RPC ATOMICO check_rate_limit
--    Parámetros:
--      p_user_id  UUID
--      p_limit    INTEGER  (máx. peticiones por ventana)
--      p_window_s INTEGER  (ventana en segundos, default 60)
--    Devuelve:
--      allowed      BOOLEAN
--      remaining    INTEGER
--      retry_after_s INTEGER (si no allowed, segundos para reintentar)
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_window_s INTEGER DEFAULT 60
)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, retry_after_s INTEGER)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window BIGINT := floor(extract(epoch FROM now()) / p_window_s)::BIGINT;
  v_count INTEGER;
BEGIN
  -- INSERT ... ON CONFLICT atómico: crea o incrementa en una sola operación
  INSERT INTO public.rate_limits (user_id, window_start, count)
  VALUES (p_user_id, v_window, 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO v_count;

  -- Si se pasó del límite, devolver retry_after
  IF v_count > p_limit THEN
    RETURN QUERY SELECT
      FALSE,
      0,
      ((v_window + 1) * p_window_s - extract(epoch FROM now())::INTEGER)::INTEGER;
  ELSE
    RETURN QUERY SELECT
      TRUE,
      (p_limit - v_count)::INTEGER,
      0;
  END IF;
END;
$$;

-- Permiso de ejecución SOLO para service_role (las edge functions usan esta clave).
-- Los usuarios autenticados NO pueden llamarlo directamente con su clave:
-- eso permitiría que se auto-limiten (o peor, que consulten el contador).
REVOKE ALL ON FUNCTION public.check_rate_limit(UUID, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(UUID, INTEGER, INTEGER) TO service_role;

-- ============================================================
-- 3. LIMPIEZA AUTOMÁTICA de ventanas viejas (evita crecimiento infinito)
--    pg_cron diario a las 03:17 UTC: borra ventanas de hace > 7 días.
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-rate-limits') THEN
      PERFORM cron.unschedule('cleanup-rate-limits');
    END IF;
    PERFORM cron.schedule(
      'cleanup-rate-limits',
      '17 3 * * *',
      $cron$
      DELETE FROM public.rate_limits
      WHERE window_start < floor(extract(epoch FROM now()) / 60)::BIGINT - 7 * 24 * 60;
      $cron$
    );
  END IF;
END $$;

-- ============================================================
-- 4. VERIFICACIÓN
-- ============================================================
-- SELECT * FROM public.rate_limits LIMIT 5;
-- SELECT * FROM public.check_rate_limit('00000000-0000-0000-0000-000000000000', 10, 60);
-- (debe devolver una fila: allowed=true, remaining=9)
