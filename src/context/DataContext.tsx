import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { UserData } from '../types';
import { useSecurity } from './SecurityContext';
import { Stitch, buildAtlasPayload } from '../services/stitch';
import { useDebounce } from '../hooks/useDebounce';
import { calculateProfitWithBoostHours, getAdBoostMultiplier } from '../utils/calculations';

interface DataContextType {
    userData: UserData;
    setUserData: React.Dispatch<React.SetStateAction<UserData>>;
    boostHours: number;
    setBoostHours: (hours: number) => void;
    dailyTarget: number;
    setDailyTarget: (target: number) => void;
    updateParcels: (parcels: { common: number; rare: number; epic: number; legendary: number }) => void;
    updateBadges: (badges: number) => void;
    isSyncing: boolean;
    isCloudLoaded: boolean;
}

const defaultUserData: UserData = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    badges: 0,
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { session } = useSecurity();
    const [isSyncing, setIsSyncing] = useState(false);
    const [isCloudLoaded, setIsCloudLoaded] = useState(false);
    const prevSessionIdRef = useRef<string | null>(null);
    const hasUserModifiedRef = useRef(false);

    // Initialize from localStorage if available, else default
    const [userData, setUserDataState] = useState<UserData>(() => {
        try {
            const saved = localStorage.getItem('atlas_userdata');
            return saved ? JSON.parse(saved) : defaultUserData;
        } catch {
            return defaultUserData;
        }
    });

    const [boostHours, setBoostHoursState] = useState<number>(() => {
        const saved = localStorage.getItem('atlas_boosthours');
        return saved ? parseFloat(saved) : 24;
    });

    const [dailyTarget, setDailyTargetState] = useState<number>(() => {
        const saved = localStorage.getItem('atlas_dailytarget');
        return saved ? parseFloat(saved) : 1.0;
    });

    // Intercept state setters to only update atlas_last_updated timestamp when modified by user
    const setUserData = (data: React.SetStateAction<UserData>) => {
        setUserDataState(prev => {
            const next = typeof data === 'function' ? (data as Function)(prev) : data;
            localStorage.setItem('atlas_last_updated', new Date().toISOString());
            hasUserModifiedRef.current = true;
            return next;
        });
    };

    const setBoostHours = (hours: number | ((prev: number) => number)) => {
        setBoostHoursState(prev => {
            const next = typeof hours === 'function' ? hours(prev) : hours;
            localStorage.setItem('atlas_last_updated', new Date().toISOString());
            hasUserModifiedRef.current = true;
            return next;
        });
    };

    const setDailyTarget = (target: number | ((prev: number) => number)) => {
        setDailyTargetState(prev => {
            const next = typeof target === 'function' ? target(prev) : target;
            localStorage.setItem('atlas_last_updated', new Date().toISOString());
            hasUserModifiedRef.current = true;
            return next;
        });
    };

    // Combine state values for atomic debouncing to prevent rate limiting & race conditions
    const combinedData = useMemo(() => ({
        userData,
        boostHours,
        dailyTarget
    }), [userData, boostHours, dailyTarget]);

    const debouncedCombinedData = useDebounce(combinedData, 2000);

    // ── Local persistence ──────────────────────────────────────────────────────
    useEffect(() => {
        localStorage.setItem('atlas_userdata', JSON.stringify(userData));
    }, [userData]);

    useEffect(() => {
        localStorage.setItem('atlas_boosthours', boostHours.toString());
    }, [boostHours]);

    useEffect(() => {
        localStorage.setItem('atlas_dailytarget', dailyTarget.toString());
    }, [dailyTarget]);

    // ── Cloud load on login (bidirectional sync fix) ───────────────────────────
    useEffect(() => {
        const currentUserId = session?.user?.id ?? null;

        // Only run when a NEW session starts (login event)
        if (!currentUserId || currentUserId === prevSessionIdRef.current) return;
        prevSessionIdRef.current = currentUserId;

        const loadFromCloud = async () => {
            hasUserModifiedRef.current = false;
            try {
                const cloudData = await Stitch.loadAtlasData(currentUserId);
                if (!cloudData) {
                    console.info('☁️ No cloud data found — using local state.');
                    setIsCloudLoaded(true);
                    return;
                }

                // Check local vs cloud timestamp
                const localLastUpdated = localStorage.getItem('atlas_last_updated');
                const localTime = localLastUpdated ? new Date(localLastUpdated).getTime() : 0;
                const cloudTime = cloudData.updated_at ? new Date(cloudData.updated_at).getTime() : 0;

                if (localLastUpdated && localTime > cloudTime) {
                    console.info('☁️ Local data is newer than cloud data. Keeping local data and scheduling sync.');
                    hasUserModifiedRef.current = true;
                    setIsCloudLoaded(true);
                    return;
                }

                // Merge: cloud wins if it has valid parcel_data
                if (cloudData.parcel_data) {
                    const { common = 0, rare = 0, epic = 0, legendary = 0 } = cloudData.parcel_data;
                    const cloudTotal = common + rare + epic + legendary;

                    // Only overwrite if cloud has actual data
                    if (cloudTotal > 0) {
                        setUserDataState(prev => ({
                            ...prev,
                            common,
                            rare,
                            epic,
                            legendary,
                        }));
                    }
                }

                if (typeof cloudData.boost_hours === 'number') {
                    setBoostHoursState(cloudData.boost_hours);
                }
                if (typeof cloudData.daily_target === 'number') {
                    setDailyTargetState(cloudData.daily_target);
                }

                // Update local timestamp to match cloud's timestamp
                if (cloudData.updated_at) {
                    localStorage.setItem('atlas_last_updated', cloudData.updated_at);
                }

                console.info('☁️ Cloud data restored successfully.');
            } catch (err) {
                console.warn('[DataContext] Cloud load failed, using local state:', err);
            } finally {
                setIsCloudLoaded(true);
            }
        };

        loadFromCloud();
    }, [session]);

    // ── Cloud sync (outbound) ──────────────────────────────────────────────────
    useEffect(() => {
        if (!session?.user?.id || !isCloudLoaded) return;
        if (!hasUserModifiedRef.current) {
            console.info('☁️ Skipping cloud sync (no user modifications).');
            return;
        }

        const syncToCloud = async () => {
            setIsSyncing(true);
            try {
                const { userData: dUserData, boostHours: dBoostHours, dailyTarget: dDailyTarget } = debouncedCombinedData;
                
                // Compute current income to persist to atlas_data columns
                const totalParcels = dUserData.common + dUserData.rare + dUserData.epic + dUserData.legendary;
                const adBoost = getAdBoostMultiplier(totalParcels);
                const { daily, monthly } = calculateProfitWithBoostHours(
                    dUserData,
                    dUserData.badges,
                    adBoost,
                    dBoostHours,
                );

                const payload = buildAtlasPayload(
                    dUserData,
                    dBoostHours,
                    dDailyTarget,
                    daily,
                    monthly,
                );

                const success = await Stitch.saveAtlasData(session.user.id, payload);
                if (success) {
                    hasUserModifiedRef.current = false;
                }
            } catch (error) {
                console.error('[DataContext] Cloud sync failed:', error);
            } finally {
                setIsSyncing(false);
            }
        };

        syncToCloud();
    }, [debouncedCombinedData, session, isCloudLoaded]);

    const updateParcels = (parcels: { common: number; rare: number; epic: number; legendary: number }) => {
        setUserData(prev => ({ ...prev, ...parcels }));
    };

    const updateBadges = (badges: number) => {
        setUserData(prev => ({ ...prev, badges }));
    };

    return (
        <DataContext.Provider value={{
            userData,
            setUserData,
            boostHours,
            setBoostHours,
            dailyTarget,
            setDailyTarget,
            updateParcels,
            updateBadges,
            isSyncing,
            isCloudLoaded,
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
