import { supabase, secureDb } from '../lib/supabase';
import { setLocalAtlasData, getLocalAtlasData, clearLocalAtlasData } from '../utils/localStorage';

import { encryptData, decryptData, generateSecureSignature } from '../lib/security/encryption';
import { logAuditEvent } from '../lib/security/audit';
import { apiRateLimiter } from '../middleware/rateLimit';
import type { UserData } from '../types';

/**
 * Quick connectivity check — verifies Supabase is reachable before critical operations.
 * Prevents silent failures when offline or misconfigured.
 */
const isSupabaseConnected = async (): Promise<boolean> => {
    try {
        const { error } = await supabase.from('users').select('id', { count: 'exact', head: true }).limit(1);
        if (error && error.code === '42P01') {
            // Table doesn't exist — schema not deployed yet
            console.warn('[STITCH] Supabase tables not found. Have you run supabase-schema.sql?');
            return false;
        }
        // Any other error means connection is established but something else is wrong
        return !error;
    } catch (err) {
        console.error('[STITCH] Cannot reach Supabase network:', err);
        return false;
    }
};

function validatePayload(data: AtlasDataPayload): string | null {
    // Ensure required fields are present and of correct type
    if (typeof data.parcels !== 'number' || data.parcels < 0) return 'Invalid parcels count';
    const pd = data.parcel_data;
    if (!pd || typeof pd.common !== 'number' || typeof pd.rare !== 'number' || typeof pd.epic !== 'number' || typeof pd.legendary !== 'number') {
        return 'Invalid parcel_data';
    }
    if (typeof data.boost_hours !== 'number' || data.boost_hours < 0) return 'Invalid boost_hours';
    if (typeof data.daily_target !== 'number' || data.daily_target < 0) return 'Invalid daily_target';
    if (typeof data.daily_income !== 'number' || data.daily_income < 0) return 'Invalid daily_income';
    if (typeof data.monthly_income !== 'number' || data.monthly_income < 0) return 'Invalid monthly_income';
    return null;
}

interface AtlasDataPayload {
    parcels: number;
    parcel_data: {
        common: number;
        rare: number;
        epic: number;
        legendary: number;
    };
    boost_hours: number;
    daily_target: number;
    daily_income: number;
    monthly_income: number;
}

export interface LoadedAtlasData {
    parcel_data: { common: number; rare: number; epic: number; legendary: number } | null;
    boost_hours: number;
    daily_target: number;
    secure_payload: string | null;
    updated_at?: string;
}

/**
 * Stitch Service
 * Orchestrates communication between the UI and Supabase.
 * Implements security layers (encryption + integrity tokens) for critical data.
 */
export const Stitch = {
    /**
     * User Management with decryption support
     */
    async getUserProfile(userId: string) {
        const data = await secureDb.queryWithAudit('users',
            supabase.from('users').select('*').eq('id', userId).single()
        );

        if (data?.secure_note) {
            data.decrypted_note = decryptData(data.secure_note);
        }

        return data;
    },

    /**
     * Securely store Atlas Earth data with computed income columns
     */
    async saveAtlasData(userId: string, atlasData: AtlasDataPayload) {
        // Validate payload before any network operation
        const validationError = validatePayload(atlasData);
        if (validationError) {
            await logAuditEvent({ action: 'DATA_SYNC', userId, metadata: { error: validationError } });
            throw new Error(`Invalid Atlas payload: ${validationError}`);
        }

        // Rate limiting: max 1 save per 2 seconds
        if (!apiRateLimiter.tryConsume(1)) {
            console.warn('[STITCH] Rate limit hit — aborting cloud save.');
            await logAuditEvent({ action: 'RATE_LIMIT_HIT', userId, metadata: { reason: 'saveAtlasData burst' } });
            throw new Error('Rate limit exceeded for saveAtlasData');
        }

        // Prepare encrypted payload before any network operation
        const encryptedData = encryptData(JSON.stringify(atlasData));
        const integrityToken = generateSecureSignature(JSON.stringify(atlasData));

        // Verify Supabase connectivity first
        const connected = await isSupabaseConnected();
        if (!connected) {
            // Fallback to local storage when offline
            await logAuditEvent({ action: 'DATA_SYNC', userId, metadata: { error: 'Supabase unreachable – using local fallback' } });
            setLocalAtlasData(userId, encryptedData);
            return true;
        }



        const payload = {
            user_id: userId,
            parcels: atlasData.parcels,
            parcel_data: atlasData.parcel_data,
            boost_hours: atlasData.boost_hours,
            daily_target: atlasData.daily_target,
            daily_income: atlasData.daily_income,
            monthly_income: atlasData.monthly_income,
            secure_payload: encryptedData,
            integrity_token: integrityToken,
            updated_at: new Date().toISOString(),
        };

        // Simple retry logic (max 2 attempts)
        let attempt = 0;
        let lastError: any = null;
        while (attempt < 2) {
            try {
                const { error } = await supabase.from('atlas_data').upsert(payload, { onConflict: 'user_id' });
                if (error) {
                    throw error;
                }
                // Success – log audit and exit loop
                await logAuditEvent({ action: 'DATA_SYNC', userId, metadata: { parcels: atlasData.parcels } });
                // Also update local storage with latest version
                setLocalAtlasData(userId, encryptedData);
                return true;
            } catch (err) {
                lastError = err;
                attempt++;
                console.warn(`[STITCH] saveAtlasData attempt ${attempt} failed:`, err);
                if (attempt >= 2) {
                    await logAuditEvent({ action: 'DATA_SYNC', userId, metadata: { error: err.message || err } });
                    // Store locally as last resort
                    setLocalAtlasData(userId, encryptedData);
                    throw err;
                }
                // small back‑off before retry
                await new Promise(res => setTimeout(res, 200));
            }
        }
        // Should never reach here
        await logAuditEvent({ action: 'DATA_SYNC', userId, metadata: { error: lastError?.message || 'Unknown' } });
        // Store locally as safety net
        setLocalAtlasData(userId, encryptedData);
        throw lastError;
    },

    /**
     * Load Atlas data from Supabase for a user — used on login to restore cloud state.
     */
    async loadAtlasData(userId: string): Promise<LoadedAtlasData | null> {
        // Rate limiting: max 1 load per 2 seconds
        if (!apiRateLimiter.tryConsume(1)) {
            console.warn('[STITCH] Rate limit hit — skipping cloud load.');
            return null;
        }

        const connected = await isSupabaseConnected();
        if (!connected) {
            // Attempt to load from local storage as fallback
            const localEncrypted = getLocalAtlasData(userId);
            if (localEncrypted) {
                try {
                    const decrypted = JSON.parse(decryptData(localEncrypted));
                    return {
                        parcel_data: decrypted.parcel_data ?? null,
                        boost_hours: decrypted.boost_hours ?? 0,
                        daily_target: decrypted.daily_target ?? 0,
                        secure_payload: localEncrypted,
                    } as LoadedAtlasData;
                } catch (e) {
                    console.error('[STITCH] Failed to decrypt local Atlas data:', e);
                }
            }
            console.warn('[STITCH] Supabase not reachable – no local data available.');
            return null;
        }

        const { data, error } = await supabase
            .from('atlas_data')
            .select('parcel_data, boost_hours, daily_target, secure_payload, updated_at')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No record found — first time user
                return null;
            }
            console.error('[STITCH] loadAtlasData error:', error.message);
            return null;
        }

        await logAuditEvent({ action: 'DATA_LOAD', userId });
        return data as LoadedAtlasData;
    },

    /**
     * Orchestrates verified calculation (can be upgraded to an Edge Function)
     */
    async getVerifiedCalculations(parcels: number, rentRate: number) {
        const result = {
            daily: parcels * rentRate * 86400,
            monthly: parcels * rentRate * 86400 * 30,
            yearly: parcels * rentRate * 86400 * 365,
        };
        return result;
    }
};

/**
 * Build an AtlasDataPayload from DataContext state + computed income values.
 */
export const buildAtlasPayload = (
    userData: UserData,
    boostHours: number,
    dailyTarget: number,
    dailyIncome: number,
    monthlyIncome: number,
): AtlasDataPayload => {
    const totalParcels = userData.common + userData.rare + userData.epic + userData.legendary;
    return {
        parcels: totalParcels,
        parcel_data: {
            common: userData.common,
            rare: userData.rare,
            epic: userData.epic,
            legendary: userData.legendary,
        },
        boost_hours: boostHours,
        daily_target: dailyTarget,
        daily_income: dailyIncome,
        monthly_income: monthlyIncome,
    };
};
