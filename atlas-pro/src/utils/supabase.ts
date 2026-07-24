import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yzykfkuoievdwqccyjtc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_YjClzHhXo654XAvea2jhtg_HDGidz5E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
