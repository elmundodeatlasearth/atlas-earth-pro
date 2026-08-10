import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Placeholder para CI/build sin secrets: evita que supabase-js lance
// "supabaseUrl is required" durante el prerender estático (output: export).
// En runtime real (navegador) siempre hay credenciales reales.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-key';

const urlFinal = supabaseUrl || PLACEHOLDER_URL;
const keyFinal = supabaseAnonKey || PLACEHOLDER_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase credentials not found in environment variables — usando placeholder. " +
    "Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(urlFinal, keyFinal);
