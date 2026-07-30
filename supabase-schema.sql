-- =====================================================
-- ATLAS EARTH PROFIT TRACKER - CLEAN & INIT SCRIPT
-- =====================================================
-- ⚠️ WARNING: This script resets the public schema.
-- It will DROP existing tables to ensure a conflict-free setup.
-- =====================================================

-- 1. CLEANUP (Drop tables and types if they exist)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS atlas_data CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_provider CASCADE;
DROP TYPE IF EXISTS sub_status CASCADE;
DROP TYPE IF EXISTS sub_type CASCADE;

-- 2. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. ENUMS (Recreated fresh)
CREATE TYPE sub_type AS ENUM ('monthly', 'lifetime');
CREATE TYPE sub_status AS ENUM ('active', 'cancelled', 'expired');
CREATE TYPE payment_provider AS ENUM ('paypal', 'klar');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE user_status AS ENUM ('active', 'trial', 'expired', 'blocked');

-- 4. TABLES

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'trial')),
  language TEXT DEFAULT 'es' CHECK (language IN ('es', 'en')),
  status user_status DEFAULT 'trial',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type sub_type NOT NULL,
  status sub_status DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  payment_provider payment_provider,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- PAYMENTS
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  provider payment_provider NOT NULL,
  status payment_status DEFAULT 'pending',
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);

-- ATLAS DATA
CREATE TABLE atlas_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  parcels INTEGER DEFAULT 0 CHECK (parcels >= 0),
  parcel_data JSONB DEFAULT '{}'::jsonb, -- Breakdown of common, rare, epic, legendary
  boost_hours DECIMAL(4, 2) DEFAULT 24,
  daily_target DECIMAL(10, 2) DEFAULT 0,
  daily_income DECIMAL(12, 8) DEFAULT 0,
  monthly_income DECIMAL(12, 8) DEFAULT 0,
  secure_payload TEXT,
  integrity_token TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE atlas_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own atlas data" ON atlas_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own atlas data" ON atlas_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own atlas data" ON atlas_data FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view audit logs" ON audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- 5. FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_atlas_data_updated_at ON atlas_data;
CREATE TRIGGER update_atlas_data_updated_at BEFORE UPDATE ON atlas_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. INDEXES
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_atlas_data_user_id ON atlas_data(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- END OF SCRIPT
-- =====================================================
