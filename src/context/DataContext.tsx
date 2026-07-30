import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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

    // Initialize from localStorage if available, else default
    const [userData, setUserData] = useState<UserData>(() => {
        try {
            const saved = localStorage.getItem('atlas_userdata');
            return saved ? JSON.parse(saved) : defaultUserData;
        } catch {
            return defaultUserData;
        }
    });

    const [boostHours, setBoostHours] = useState<number>(() => {
        const saved = localStorage.getItem('atlas_boosthours');
        return saved ? parseFloat(saved) : 24;
    });

    const [dailyTarget, setDailyTarget] = useState<number>(() => {
        const saved = localStorage.getItem('atlas_dailytarget');
        return saved ? parseFloat(saved) : 1.0;
    });

    // Debounce values for cloud sync to avoid too many requests
    const debouncedUserData = useDebounce(userData, 2000);
    const debouncedBoostHours = useDebounce(boostHours, 2000);
    const debouncedDailyTarget = useDebounce(dailyTarget, 2000);

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
            try {
                const cloudData = await Stitch.loadAtlasData(currentUserId);
                if (!cloudData) {
                    console.info('☁️ No cloud data found — using local state.');
                    setIsCloudLoaded(true);
                    return;
                }

                // Merge: cloud wins if it has valid parcel_data
                if (cloudData.parcel_data) {
                    const { common = 0, rare = 0, epic = 0, legendary = 0 } = cloudData.parcel_data;
                    const cloudTotal = common + rare + epic + legendary;

                    // Only overwrite if cloud has actual data
                    if (cloudTotal > 0) {
                        setUserData(prev => ({
                            ...prev,
                            common,
                            rare,
                            epic,
                            legendary,
                        }));
                    }
                }

                if (typeof cloudData.boost_hours === 'number') {
                    setBoostHours(cloudData.boost_hours);
                }
                if (typeof cloudData.daily_target === 'number') {
                    setDailyTarget(cloudData.daily_target);
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

        const syncToCloud = async () => {
            setIsSyncing(true);
            try {
                // Compute current income to persist to atlas_data columns
                const totalParcels = debouncedUserData.common + debouncedUserData.rare + debouncedUserData.epic + debouncedUserData.legendary;
                const adBoost = getAdBoostMultiplier(totalParcels);
                const { daily, monthly } = calculateProfitWithBoostHours(
                    debouncedUserData,
                    debouncedUserData.badges,
                    adBoost,
                    debouncedBoostHours,
                );

                const payload = buildAtlasPayload(
                    debouncedUserData,
                    debouncedBoostHours,
                    debouncedDailyTarget,
                    daily,
                    monthly,
                );

                await Stitch.saveAtlasData(session.user.id, payload);
            } catch (error) {
                console.error('[DataContext] Cloud sync failed:', error);
            } finally {
                setIsSyncing(false);
            }
        };

        syncToCloud();
    }, [debouncedUserData, debouncedBoostHours, debouncedDailyTarget, session, isCloudLoaded]);

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
