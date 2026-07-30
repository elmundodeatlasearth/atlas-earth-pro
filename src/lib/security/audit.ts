import { supabase } from '../supabase';

export type AuditAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'DATA_SYNC'
    | 'DATA_LOAD'
    | 'DATA_EXPORT'
    | 'DATA_IMPORT'
    | 'DATA_CLEAR'
    | 'SNAPSHOT_CREATED'
    | 'SNAPSHOT_DELETED'
    | 'SUBSCRIPTION_UPGRADE'
    | 'ANOMALY_DETECTED'
    | 'RATE_LIMIT_HIT'
    | 'AUTH_FAILED'
    | 'DEMO_MODE_ACTIVATED';

export interface AuditEntry {
    action: AuditAction;
    userId?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Writes an audit log entry to Supabase and console.
 * Fails silently to never block the main flow.
 */
export const logAuditEvent = async (entry: AuditEntry): Promise<void> => {
    const timestamp = new Date().toISOString();
    const userAgent = navigator.userAgent.slice(0, 200);

    // Always log to console for dev visibility
    console.info(`[AUDIT] ${timestamp} | ${entry.action}`, entry.metadata ?? '');

    if (!entry.userId) return; // Don't write to DB without a user

    try {
        await supabase.from('audit_logs').insert({
            user_id: entry.userId,
            action: entry.action,
            user_agent: userAgent,
            metadata: entry.metadata ?? null,
        });
    } catch (error) {
        // Silently fail — audit logging must never break the app
        console.warn('[AUDIT] Failed to write audit log to DB:', error);
    }
};

/**
 * Convenience wrapper for security anomaly logs (high priority).
 */
export const logAnomaly = async (userId: string | undefined, description: string): Promise<void> => {
    return logAuditEvent({
        action: 'ANOMALY_DETECTED',
        userId,
        metadata: { description, severity: 'HIGH' },
    });
};
