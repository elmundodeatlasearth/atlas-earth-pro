// -----------------------------------------------------------------------------
// Supabase client configuration with environment validation
// -----------------------------------------------------------------------------
import { createClient } from '@supabase/supabase-js';

// Validate required environment variables – fail fast with a clear message
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL is not defined. Please set it in your .env file.');
}

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY is not defined. Please set it in your .env file.');
}

// Export a factory for possible future re‑initialisation (e.g., tests)
export const getSupabase = () => {
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'atlas_auth_token',
            flowType: 'pkce', // Recommended for high security
        },
    });
};

// Single shared instance used by the app
export const supabase = getSupabase();

/**
 * High‑security wrapper for database operations
 */
export const secureDb = {
    /**
     * Safe fetch with automatic audit logging hint
     */
    async queryWithAudit(tableName: string, query: any) {
        const { data, error } = await query;
        if (error) {
            // In a real military‑grade app, we'd fire an audit log event here
            console.error(`[SECURITY AUDIT] Error querying ${tableName}:`, error);
            throw error;
        }
        return data;
    },
};

// Monitor session changes for potential anomaly detection
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        console.log('[SECURITY] User session initiated:', session?.user.id);
    } else if (event === 'SIGNED_OUT') {
        console.log('[SECURITY] User session terminated');
        // Clear any sensitive local state if necessary
    } else if (event === 'TOKEN_REFRESHED') {
        console.log('[SECURITY] Auth token rotated successfully');
    }
});
