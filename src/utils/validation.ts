/**
 * Validation utilities for Atlas Earth Calculator
 */

export const LIMITS = {
    PARCELS: {
        MIN: 0,
        MAX: 10000,
    },
    BADGES: {
        MIN: 0,
        MAX: 200,
    },
    BOOST_HOURS: {
        MIN: 0,
        MAX: 24,
    },
    AD_BOOST: {
        MIN: 2,
        MAX: 30,
    },
    DAILY_TARGET: {
        MIN: 0.01,
        MAX: 10000,
    },
} as const;

export const ERROR_MESSAGES = {
    PARCELS_OUT_OF_RANGE: `Las parcelas deben estar entre ${LIMITS.PARCELS.MIN} y ${LIMITS.PARCELS.MAX}`,
    BADGES_OUT_OF_RANGE: `Las insignias deben estar entre ${LIMITS.BADGES.MIN} y ${LIMITS.BADGES.MAX}`,
    BOOST_HOURS_OUT_OF_RANGE: `Las horas de boost deben estar entre ${LIMITS.BOOST_HOURS.MIN} y ${LIMITS.BOOST_HOURS.MAX}`,
    AD_BOOST_OUT_OF_RANGE: `El multiplicador debe estar entre ${LIMITS.AD_BOOST.MIN}x y ${LIMITS.AD_BOOST.MAX}x`,
    DAILY_TARGET_OUT_OF_RANGE: `La meta diaria debe estar entre $${LIMITS.DAILY_TARGET.MIN} y $${LIMITS.DAILY_TARGET.MAX}`,
    INVALID_NUMBER: 'Por favor ingresa un número válido',
} as const;

/**
 * Validates parcel count
 */
export const validateParcels = (value: number): { valid: boolean; error?: string } => {
    if (isNaN(value)) {
        return { valid: false, error: ERROR_MESSAGES.INVALID_NUMBER };
    }
    if (value < LIMITS.PARCELS.MIN || value > LIMITS.PARCELS.MAX) {
        return { valid: false, error: ERROR_MESSAGES.PARCELS_OUT_OF_RANGE };
    }
    return { valid: true };
};

/**
 * Validates badge count
 */
export const validateBadges = (value: number): { valid: boolean; error?: string } => {
    if (isNaN(value)) {
        return { valid: false, error: ERROR_MESSAGES.INVALID_NUMBER };
    }
    if (value < LIMITS.BADGES.MIN || value > LIMITS.BADGES.MAX) {
        return { valid: false, error: ERROR_MESSAGES.BADGES_OUT_OF_RANGE };
    }
    return { valid: true };
};

/**
 * Validates boost hours
 */
export const validateBoostHours = (value: number): { valid: boolean; error?: string } => {
    if (isNaN(value)) {
        return { valid: false, error: ERROR_MESSAGES.INVALID_NUMBER };
    }
    if (value < LIMITS.BOOST_HOURS.MIN || value > LIMITS.BOOST_HOURS.MAX) {
        return { valid: false, error: ERROR_MESSAGES.BOOST_HOURS_OUT_OF_RANGE };
    }
    return { valid: true };
};

/**
 * Validates daily target
 */
export const validateDailyTarget = (value: number): { valid: boolean; error?: string } => {
    if (isNaN(value)) {
        return { valid: false, error: ERROR_MESSAGES.INVALID_NUMBER };
    }
    if (value < LIMITS.DAILY_TARGET.MIN || value > LIMITS.DAILY_TARGET.MAX) {
        return { valid: false, error: ERROR_MESSAGES.DAILY_TARGET_OUT_OF_RANGE };
    }
    return { valid: true };
};

/**
 * Clamps a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
};

/**
 * Safely parses an integer with fallback
 */
export const safeParseInt = (value: string, fallback: number = 0): number => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
};

/**
 * Safely parses a float with fallback
 */
export const safeParseFloat = (value: string, fallback: number = 0): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
};
