-- Supabase Seed: datos de desarrollo opcionales
-- Este archivo se ejecuta tras las migraciones con `supabase db reset`
-- En producción NO es necesario (los usuarios se crean con el trigger on_auth_user_created)

-- Ejemplo de fila de desarrollo (solo si quieres probar con datos de ejemplo):
-- INSERT INTO usuarios_atlas (user_id, is_vip, is_ultra, ai_credits, perfil_data)
-- VALUES ('00000000-0000-0000-0000-000000000000', false, false, 3, '{}'::jsonb)
-- ON CONFLICT (user_id) DO NOTHING;

-- No hay seeds por defecto — la app funciona sin datos iniciales.
SELECT 1;
