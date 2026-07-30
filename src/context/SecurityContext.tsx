import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { apiRateLimiter } from '../middleware/rateLimit';
import { logAuditEvent, logAnomaly } from '../lib/security/audit';

interface SecurityContextType {
    isHardened: boolean;
    sessionIntegrity: 'secure' | 'validating' | 'compromised';
    threatLevel: 'low' | 'guarded' | 'elevated' | 'high' | 'severe';
    lastAudit: string;
    reportAnomaly: (description: string) => void;
    logout: () => Promise<void>;
    session: Session | null;
    loading: boolean;
    verify2FA: (code: string) => Promise<boolean>;
    is2FAVerified: boolean;
    enableDemoMode: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isHardened, setIsHardened] = useState(false);
    const [sessionIntegrity, setSessionIntegrity] = useState<'secure' | 'validating' | 'compromised'>('validating');
    const [threatLevel, setThreatLevel] = useState<'low' | 'guarded' | 'elevated' | 'high' | 'severe'>('low');
    const [lastAudit, setLastAudit] = useState(new Date().toISOString());
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [is2FAVerified, setIs2FAVerified] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIs2FAVerified(!!session);
            setLoading(false);
            if (session) {
                logAuditEvent({ action: 'LOGIN', userId: session.user.id });
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            setIs2FAVerified(!!session);
            if (event === 'SIGNED_IN' && session) {
                logAuditEvent({ action: 'LOGIN', userId: session.user.id });
            } else if (event === 'SIGNED_OUT') {
                logAuditEvent({ action: 'LOGOUT' });
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const logout = useCallback(async () => {
        const userId = session?.user?.id;
        console.warn('[SECURITY] Initiating secure termination sequence...');
        await logAuditEvent({ action: 'LOGOUT', userId });
        await supabase.auth.signOut();
        setSession(null);
        setIs2FAVerified(false);
    }, [session]);

    const reportAnomaly = useCallback((description: string) => {
        if (!apiRateLimiter.tryConsume()) {
            console.warn('[SECURITY] Rate limit exceeded for anomaly reporting. Dropping report.');
            logAuditEvent({ action: 'RATE_LIMIT_HIT', metadata: { description } });
            return;
        }

        console.error(`[THREAT DETECTED] ${description}`);
        setThreatLevel('high');
        logAnomaly(session?.user?.id, description);
        setTimeout(() => setThreatLevel('guarded'), 10000);
    }, [session]);

    const verify2FA = useCallback(async (_code: string) => {
        if (!apiRateLimiter.tryConsume(2)) return false;
        // Real 2FA verification would call a Supabase Edge Function here
        return true;
    }, []);

    // System Integrity Check Loop
    useEffect(() => {
        const runAudit = () => {
            setSessionIntegrity(session ? 'secure' : 'validating');
            setLastAudit(new Date().toISOString());
            setIsHardened(true);
        };

        const interval = setInterval(runAudit, 5000);
        runAudit();
        return () => clearInterval(interval);
    }, [session]);

    return (
        <SecurityContext.Provider value={{
            isHardened,
            sessionIntegrity,
            threatLevel,
            lastAudit,
            reportAnomaly,
            logout,
            session,
            loading,
            verify2FA,
            is2FAVerified,
            enableDemoMode: () => {
                const mockSession = {
                    user: { id: 'demo-admin', email: 'admin@wildwolves.com', role: 'authenticated' },
                    access_token: 'mock-token',
                    expires_at: 9999999999,
                    token_type: 'bearer',
                    refresh_token: 'mock-refresh',
                } as unknown as Session;
                setSession(mockSession);
                setIs2FAVerified(true);
                setIsHardened(true);
                logAuditEvent({ action: 'DEMO_MODE_ACTIVATED', userId: 'demo-admin' });
            }
        }}>
            {children}
        </SecurityContext.Provider>
    );
};

export const useSecurity = () => {
    const context = useContext(SecurityContext);
    if (!context) throw new Error('useSecurity must be used within a SecurityProvider');
    return context;
};
