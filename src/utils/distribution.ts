/**
 * Parcel Distribution Utilities
 * Automatic calculation of parcel distribution based on official probabilities
 */

export interface ParcelDistribution {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
}

/**
 * Official Atlas Earth parcel drop probabilities
 */
export const PARCEL_PROBABILITIES = {
    COMMON: 0.50,      // 50%
    RARE: 0.30,        // 30%
    EPIC: 0.15,        // 15%
    LEGENDARY: 0.05,   // 5%
} as const;

/**
 * Calculate automatic parcel distribution based on total count
 * Uses official Atlas Earth probabilities
 * 
 * @param totalParcels Total number of parcels owned
 * @returns Distribution object with counts for each rarity
 * 
 * @example
 * calculateParcelDistribution(218)
 * // Returns: { common: 109, rare: 65, epic: 33, legendary: 11 }
 */
export const calculateParcelDistribution = (totalParcels: number): ParcelDistribution => {
    if (totalParcels < 0) {
        return { common: 0, rare: 0, epic: 0, legendary: 0 };
    }

    const common = Math.floor(totalParcels * PARCEL_PROBABILITIES.COMMON);
    const rare = Math.floor(totalParcels * PARCEL_PROBABILITIES.RARE);
    const epic = Math.floor(totalParcels * PARCEL_PROBABILITIES.EPIC);
    const legendary = Math.floor(totalParcels * PARCEL_PROBABILITIES.LEGENDARY);

    // Distribute rounding remainder proportionally (largest remainder method)
    // This ensures the distribution stays closer to official probabilities
    const rarities = ['common', 'rare', 'epic', 'legendary'] as const;
    const rawValues = [
        totalParcels * PARCEL_PROBABILITIES.COMMON,
        totalParcels * PARCEL_PROBABILITIES.RARE,
        totalParcels * PARCEL_PROBABILITIES.EPIC,
        totalParcels * PARCEL_PROBABILITIES.LEGENDARY,
    ];

    // Floored values
    const floored = rawValues.map(v => Math.floor(v));
    let totalFloored = floored.reduce((a, b) => a + b, 0);
    let remainder = totalParcels - totalFloored;

    // Sort by fractional part descending to allocate remainders most fairly
    const indexed = rawValues
        .map((v, i) => ({ index: i, fraction: v - Math.floor(v), floors: Math.floor(v) }))
        .sort((a, b) => b.fraction - a.fraction);

    let i = 0;
    while (remainder > 0 && i < indexed.length) {
        indexed[i].floors += 1;
        remainder--;
        i++;
    }

    // Restore sorted order to original positions
    const result = indexed.sort((a, b) => a.index - b.index);

    return {
        common: result[0].floors,
        rare: result[1].floors,
        epic: result[2].floors,
        legendary: result[3].floors,
    };
};

/**
 * Validate if a custom distribution matches the total
 * 
 * @param distribution Custom distribution object
 * @param expectedTotal Expected total parcel count
 * @returns True if distribution is valid
 */
export const validateDistribution = (
    distribution: ParcelDistribution,
    expectedTotal: number
): boolean => {
    const actualTotal = distribution.common + distribution.rare + distribution.epic + distribution.legendary;
    return actualTotal === expectedTotal;
};

/**
 * Get distribution as percentages
 * 
 * @param distribution Distribution object
 * @returns Percentages for each rarity
 */
export const getDistributionPercentages = (distribution: ParcelDistribution) => {
    const total = distribution.common + distribution.rare + distribution.epic + distribution.legendary;

    if (total === 0) {
        return { common: 0, rare: 0, epic: 0, legendary: 0 };
    }

    return {
        common: Math.round((distribution.common / total) * 100),
        rare: Math.round((distribution.rare / total) * 100),
        epic: Math.round((distribution.epic / total) * 100),
        legendary: Math.round((distribution.legendary / total) * 100),
    };
};

/**
 * Calculate average parcel cost based on official prices
 * Common: $0.25, Rare: $0.375, Epic: $0.50, Legendary: $1.00
 */
export const PARCEL_COSTS = {
    COMMON: 0.25,
    RARE: 0.375,
    EPIC: 0.50,
    LEGENDARY: 1.00,
} as const;

/**
 * Calculate total purchase cost for parcels
 * 
 * @param distribution Distribution of parcels
 * @returns Total cost in USD
 */
export const calculatePurchaseCost = (distribution: ParcelDistribution): number => {
    return (
        distribution.common * PARCEL_COSTS.COMMON +
        distribution.rare * PARCEL_COSTS.RARE +
        distribution.epic * PARCEL_COSTS.EPIC +
        distribution.legendary * PARCEL_COSTS.LEGENDARY
    );
};

/**
 * Calculate cost for a specific number of parcels using average distribution
 * 
 * @param parcelCount Number of parcels
 * @returns Estimated cost in USD
 */
export const estimateParcelCost = (parcelCount: number): number => {
    const distribution = calculateParcelDistribution(parcelCount);
    return calculatePurchaseCost(distribution);
};

/**
 * Badge cost (approximate)
 */
export const BADGE_COST = 2.00; // $2.00 per badge (approximate)

/**
 * Calculate total investment cost
 * 
 * @param parcels Number of parcels
 * @param badges Number of badges
 * @returns Total cost breakdown
 */
export const calculateTotalInvestment = (parcels: number, badges: number) => {
    const parcelCost = estimateParcelCost(parcels);
    const badgeCost = badges * BADGE_COST;

    return {
        parcels: parcelCost,
        badges: badgeCost,
        total: parcelCost + badgeCost,
    };
};
