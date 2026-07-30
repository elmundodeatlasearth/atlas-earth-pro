// src/utils/localStorage.ts

/**
 * Simple wrapper around browser localStorage for Atlas data persistence.
 * Uses the same encryption format as the remote sync to keep data secure.
 */
export const setLocalAtlasData = (userId: string, encryptedData: string) => {
    try {
        const key = `atlas_data_${userId}`;
        localStorage.setItem(key, encryptedData);
    } catch (e) {
        console.error('[LocalStorage] Failed to set data:', e);
    }
};

export const getLocalAtlasData = (userId: string): string | null => {
    try {
        const key = `atlas_data_${userId}`;
        return localStorage.getItem(key);
    } catch (e) {
        console.error('[LocalStorage] Failed to get data:', e);
        return null;
    }
};

export const clearLocalAtlasData = (userId: string) => {
    try {
        const key = `atlas_data_${userId}`;
        localStorage.removeItem(key);
    } catch (e) {
        console.error('[LocalStorage] Failed to clear data:', e);
    }
};
