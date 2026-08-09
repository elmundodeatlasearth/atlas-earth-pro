-- Supabase SQL Migration: Create tables for Atlas Earth PRO
-- Execute this in your Supabase SQL Editor

-- ============================================================
-- Table: usuarios_atlas
-- Stores user plan info, credits, and profile data
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios_atlas (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_vip BOOLEAN NOT NULL DEFAULT false,
  is_ultra BOOLEAN NOT NULL DEFAULT false,
  ai_credits INTEGER NOT NULL DEFAULT 0,
  perfil_data JSONB DEFAULT '{}'::jsonb,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
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
-- Table: historial_atlas
-- Stores daily history snapshots for premium users
-- ============================================================
CREATE TABLE IF NOT EXISTS historial_atlas (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  ab_generado INTEGER NOT NULL DEFAULT 0,
  usd_generado REAL NOT NULL DEFAULT 0,
  diamantes_obtenidos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, fecha)
);

-- Index for faster history queries
CREATE INDEX IF NOT EXISTS idx_historial_atlas_user_fecha
  ON historial_atlas(user_id, fecha DESC);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE usuarios_atlas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_atlas ENABLE ROW LEVEL SECURITY;

-- Users can read only their own data
CREATE POLICY "Users read own usuario"
  ON usuarios_atlas FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update only their own data
CREATE POLICY "Users insert own usuario"
  ON usuarios_atlas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own usuario"
  ON usuarios_atlas FOR UPDATE
  USING (auth.uid() = user_id);

-- History: users read/write own
CREATE POLICY "Users read own history"
  ON historial_atlas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own history"
  ON historial_atlas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own history"
  ON historial_atlas FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- Function: increment_ai_credits
-- Called by stripe-webhook edge function after successful payment
-- ============================================================
CREATE OR REPLACE FUNCTION increment_ai_credits(p_user_id UUID, p_amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE usuarios_atlas
  SET ai_credits = ai_credits + p_amount
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
