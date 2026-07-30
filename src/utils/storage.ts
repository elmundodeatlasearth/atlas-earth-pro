/**
 * LocalStorage utilities for persisting calculator data
 */

import type { UserData } from '../types';

const STORAGE_KEYS = {
    USER_DATA: 'atlas_calculator_user_data',
    CALCULATION_HISTORY: 'atlas_calculator_history',
    PREFERENCES: 'atlas_calculator_preferences',
} as const;

export interface CalculationHistoryItem {
    id: string;
    timestamp: number;
    userData: UserData;
    adBoost: number;
    dailyIncome: number;
    monthlyIncome: number;
}

export interface UserPreferences {
    isDarkMode: boolean;
    defaultAdBoost: number;
    defaultBoostHours: number;
}

/**
 * Save user data to localStorage
 */
export const saveUserData = (userData: UserData): void => {
    try {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
        console.error('Error saving user data:', error);
    }
};

/**
 * Load user data from localStorage
 */
export const loadUserData = (): UserData | null => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error loading user data:', error);
        return null;
    }
};

/**
 * Save calculation to history
 */
export const saveCalculationToHistory = (item: Omit<CalculationHistoryItem, 'id' | 'timestamp'>): void => {
    try {
        const history = getCalculationHistory();
        const newItem: CalculationHistoryItem = {
            ...item,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
        };

        // Keep only last 10 calculations
        const updatedHistory = [newItem, ...history].slice(0, 10);
        localStorage.setItem(STORAGE_KEYS.CALCULATION_HISTORY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.error('Error saving calculation history:', error);
    }
};

/**
 * Get calculation history
 */
export const getCalculationHistory = (): CalculationHistoryItem[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.CALCULATION_HISTORY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading calculation history:', error);
        return [];
    }
};

/**
 * Clear calculation history
 */
export const clearCalculationHistory = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEYS.CALCULATION_HISTORY);
    } catch (error) {
        console.error('Error clearing calculation history:', error);
    }
};

/**
 * Save user preferences
 */
export const savePreferences = (preferences: UserPreferences): void => {
    try {
        localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
        console.error('Error saving preferences:', error);
    }
};

/**
 * Load user preferences
 */
export const loadPreferences = (): UserPreferences | null => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error loading preferences:', error);
        return null;
    }
};

/**
 * Export all data as JSON
 */
export const exportAllData = (): string => {
    const userData = loadUserData();
    const history = getCalculationHistory();
    const preferences = loadPreferences();

    return JSON.stringify({
        userData,
        history,
        preferences,
        exportDate: new Date().toISOString(),
    }, null, 2);
};

/**
 * Import data from JSON
 */
export const importData = (jsonString: string): boolean => {
    try {
        const data = JSON.parse(jsonString);

        if (data.userData) saveUserData(data.userData);
        if (data.preferences) savePreferences(data.preferences);
        if (data.history) {
            localStorage.setItem(STORAGE_KEYS.CALCULATION_HISTORY, JSON.stringify(data.history));
        }

        return true;
    } catch (error) {
        console.error('Error importing data:', error);
        return false;
    }
};
