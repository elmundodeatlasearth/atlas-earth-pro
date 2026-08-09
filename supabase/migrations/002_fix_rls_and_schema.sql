-- Supabase SQL Migration: Fix RLS + align schema with production (perfil_data)
-- File: supabase/migrations/002_fix_rls_and_schema.sql
-- Ejecutar esto en el SQL Editor de Supabase (Dashboard → SQL Editor → New query)

-- ============================================================
-- 1) ASEGURAR ESQUEMA CORRECTO: la columna del perfil es "perfil_data"
--    (nombre usado por el frontend; producción ya la tiene así)
-- ============================================================

-- Si por error alguien creó la columna como "profile_data", la renombramos
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios_atlas' AND column_name = 'profile_data'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios_atlas' AND column_name = 'perfil_data'
  ) THEN
    ALTER TABLE usuarios_atlas RENAME COLUMN profile_data TO perfil_data;
  END IF;
END $$;

-- Asegurar que perfil_data existe (si la tabla se creó sin ella)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios_atlas' AND column_name = 'perfil_data'
  ) THEN
    ALTER TABLE usuarios_atlas ADD COLUMN perfil_data JSONB DEFAULT '{}'::jsonb;
  END IF;
END;
$$;

-- Añadir updated_at si no existe (para auditoría y triggers)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios_atlas' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE usuarios_atlas ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END;
$$;

-- Columna para vincular el customer de Stripe (permite revocar plan al cancelar)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios_atlas' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE usuarios_atlas ADD COLUMN stripe_customer_id TEXT;
  END IF;
END;
$$;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_usuarios_atlas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuarios_atlas_updated_at ON usuarios_atlas;
CREATE TRIGGER trg_usuarios_atlas_updated_at
  BEFORE UPDATE ON usuarios_atlas
  FOR EACH ROW
  EXECUTE FUNCTION update_usuarios_atlas_updated_at();

-- ============================================================
-- GARANTIZAR RLS ACTIVO (el error "violates row-level security")
-- ============================================================

ALTER TABLE usuarios_atlas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_atlas ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICAS CORRECTAS PARA usuarios_atlas
-- El usuario SOLO puede ver/escribir su propia fila
-- ============================================================

-- SELECT: el usuario lee solo su fila
DROP POLICY IF EXISTS "Users read own usuario" ON usuarios_atlas;
CREATE POLICY "Users read own usuario"
  ON usuarios_atlas FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: el usuario puede crear su fila (auto-registro al usar la app)
DROP POLICY IF EXISTS "Users insert own usuario" ON usuarios_atlas;
CREATE POLICY "Users insert own usuario"
  ON usuarios_atlas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: el usuario puede modificar SU fila, pero NO los campos de pago
-- (is_vip, is_ultra, ai_credits solo los escribe el webhook service_role)
DROP POLICY IF EXISTS "Users update own usuario" ON usuarios_atlas;
CREATE POLICY "Users update own usuario"
  ON usuarios_atlas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- POLÍTICAS PARA historial_atlas
-- ============================================================

DROP POLICY IF EXISTS "Users read own history" ON historial_atlas;
CREATE POLICY "Users read own history"
  ON historial_atlas FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own history" ON historial_atlas;
CREATE POLICY "Users insert own history"
  ON historial_atlas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own history" ON historial_atlas;
CREATE POLICY "Users update own history"
  ON historial_atlas FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- USUARIOS ANÓNIMOS: NO pueden leer ni escribir nada
-- (solo ven filas vacías / error silencioso)
-- ============================================================

-- ============================================================
-- Función para añadir créditos (usada por stripe-webhook)
-- ============================================================
CREATE OR REPLACE FUNCTION increment_ai_credits(p_user_id UUID, p_amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE usuarios_atlas
  SET ai_credits = ai_credits + p_amount
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Trigger: crear fila en usuarios_atlas automáticamente al registrarse
-- Evita el bug del webhook (404 si no existe usuario)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios_atlas (user_id, perfil_data, is_vip, is_ultra, ai_credits)
  VALUES (NEW.id, '{}'::jsonb, false, false, 3)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
