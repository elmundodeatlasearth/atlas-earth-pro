/**
 * Atlas Earth Rent Rates (per second in USD)
 * Updated based on real user data verification
 */

// Base rent rates in USD per second (verified with real data)
export const RENT_RATES = {
    COMMON: 0.0000000011,      // ~$0.000095/day per parcel
    RARE: 0.0000000016,        // ~$0.000138/day per parcel
    EPIC: 0.0000000022,        // ~$0.00019/day per parcel
    LEGENDARY: 0.0000000044,   // ~$0.00038/day per parcel
};

/**
 * Badge (Passport) Boost System
 * Permanent percentage increase to all rent
 */
export const BADGE_BOOSTS = [
    { min: 0, max: 0, boost: 0, level: 0 },      // No badges
    { min: 1, max: 10, boost: 0.05, level: 1 },  // 5% boost
    { min: 11, max: 30, boost: 0.10, level: 2 }, // 10% boost
    { min: 31, max: 60, boost: 0.15, level: 3 }, // 15% boost
    { min: 61, max: 100, boost: 0.20, level: 4 }, // 20% boost
    { min: 101, max: Infinity, boost: 0.25, level: 5 }, // 25% boost (max)
];

export const getBadgeBoost = (totalBadges: number): { boost: number; level: number } => {
    const tier = BADGE_BOOSTS.find(
        (b) => totalBadges >= b.min && totalBadges <= b.max
    );
    return tier ? { boost: tier.boost, level: tier.level } : { boost: 0, level: 0 };
};

/**
 * Ad Boost Tiers based on total parcels
 */
export const BOOST_TIERS = [
    { max: 150, multiplier: 30 },
    { max: 220, multiplier: 20 },
    { max: 290, multiplier: 15 },
    { max: 365, multiplier: 12 },
    { max: 435, multiplier: 10 },
    { max: 545, multiplier: 8 },
    { max: 625, multiplier: 7 },
    { max: 725, multiplier: 6 },
    { max: 875, multiplier: 5 },
    { max: 1100, multiplier: 4 },
    { max: 1500, multiplier: 3 },
    { max: Infinity, multiplier: 2 },
];

export const getAdBoostMultiplier = (totalParcels: number): number => {
    const tier = BOOST_TIERS.find(t => totalParcels <= t.max);
    return tier ? tier.multiplier : 2;
};

/**
 * Calculate total base rent per second from all parcels
 */
export const calculateBaseRentPerSecond = (parcels: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
}): number => {
    return (
        parcels.common * RENT_RATES.COMMON +
        parcels.rare * RENT_RATES.RARE +
        parcels.epic * RENT_RATES.EPIC +
        parcels.legendary * RENT_RATES.LEGENDARY
    );
};

export interface DetailedScenarioResult {
    perSecond: { base: number; boosted: number };
    perMinute: { base: number; boosted: number };
    perHour: { base: number; boosted: number };
    perDay: { base: number; boosted: number; avg: number };
    perWeek: { base: number; boosted: number };
    perMonth: { base: number; boosted: number; avg: number };
    perYear: { base: number; boosted: number; avg: number };
    srb: {
        payPerEvent32h: number;
        payPerEvent64h: number;
        hourly: number;
    };
    constants: {
        adBoost: number;
        badgeBoost: number;
        srbMultiplier: number;
        srbHoursPerMonth: number;
        boostHoursPerDay: number;
    }
}

/**
 * Calculate comprehensive profit with detailed breakdown
 * Supports SRB events and weighted averages
 */
export const calculateDetailedScenario = (
    parcels: { common: number; rare: number; epic: number; legendary: number },
    badges: number,
    boostHoursPerDay: number,
    forceSrb50x: boolean = false, // If true, treats ALL ad boost time as 50x (unrealistic for yearly, good for "what if")
    customSrbHoursPerMonth: number = 64, // Default per images
    customSrbMultiplier: number = 50,
    forcedAdBoostMultiplier?: number // Override default tier
): DetailedScenarioResult => {
    const totalParcels = parcels.common + parcels.rare + parcels.epic + parcels.legendary;
    const basePerSecond = calculateBaseRentPerSecond(parcels);
    const badgeInfo = getBadgeBoost(badges);
    const badgeMultiplier = 1 + badgeInfo.boost;

    // Defensive clamping: boost hours must be 0-24
    const safeBoostHours = Math.min(24, Math.max(0, boostHoursPerDay));

    // Base Rent (With Badge only)
    const baseRentWithBadge = basePerSecond * badgeMultiplier; // This corresponds to "Base" column

    // Ad Boost Multiplier
    const normalAdBoostMultiplier = forcedAdBoostMultiplier || getAdBoostMultiplier(totalParcels);

    // Effective Multiplier for "Boosted" column logic
    const effectiveAdBoostMultiplier = forceSrb50x ? customSrbMultiplier : normalAdBoostMultiplier;

    // "WITH Ad Boost" Column Logic:
    // The "WITH Ad Boost" column in the image seems to represent the rate WHILE boosting.
    const boostedRentPerSecond = baseRentWithBadge * effectiveAdBoostMultiplier;

    // --- Weighted Average Calculations ---
    const dutyCycle = safeBoostHours / 24;
    const dailyBoostedHours = safeBoostHours;
    const dailyUnboostedHours = 24 - safeBoostHours;

    // --- Standard Day (Normal Boost) ---
    const dailyIncomeNormal =
        (baseRentWithBadge * effectiveAdBoostMultiplier * dailyBoostedHours * 3600) +
        (baseRentWithBadge * 1 * dailyUnboostedHours * 3600);

    // --- SRB Event Day (Super Boost) ---
    // We assume same Duty Cycle applies during SRB
    const dailyIncomeSRB =
        (baseRentWithBadge * customSrbMultiplier * dailyBoostedHours * 3600) +
        (baseRentWithBadge * 1 * dailyUnboostedHours * 3600);

    // --- Averages ---
    const daysInMonth = 365 / 12; // ~30.4167

    // SRB Days per month
    const srbDaysPerMonth = customSrbHoursPerMonth / 24;
    const normalDaysPerMonth = daysInMonth - srbDaysPerMonth;

    const monthlyIncomeWeighted =
        (dailyIncomeNormal * normalDaysPerMonth) +
        (dailyIncomeSRB * srbDaysPerMonth);

    const yearlyIncomeWeighted = monthlyIncomeWeighted * 12;
    const dailyIncomeWeightedAvg = yearlyIncomeWeighted / 365;

    // --- Construct Result Object matching the columns ---
    return {
        perSecond: {
            base: baseRentWithBadge,
            boosted: boostedRentPerSecond
        },
        perMinute: {
            base: baseRentWithBadge * 60,
            boosted: boostedRentPerSecond * 60
        },
        perHour: {
            base: baseRentWithBadge * 3600,
            boosted: boostedRentPerSecond * 3600
        },
        perDay: {
            base: baseRentWithBadge * 86400,
            boosted: dailyIncomeNormal, // Uses Duty Cycle
            avg: dailyIncomeWeightedAvg
        },
        perWeek: {
            base: baseRentWithBadge * 86400 * 7,
            boosted: dailyIncomeNormal * 7
        },
        perMonth: {
            base: baseRentWithBadge * 86400 * daysInMonth,
            boosted: monthlyIncomeWeighted, // Weighted with SRB
            avg: monthlyIncomeWeighted
        },
        perYear: {
            base: baseRentWithBadge * 86400 * 365,
            boosted: yearlyIncomeWeighted,
            avg: yearlyIncomeWeighted
        },
        srb: {
            payPerEvent32h: (32 * dutyCycle * baseRentWithBadge * customSrbMultiplier * 3600) + (32 * (1 - dutyCycle) * baseRentWithBadge * 3600),
            payPerEvent64h: (64 * dutyCycle * baseRentWithBadge * customSrbMultiplier * 3600) + (64 * (1 - dutyCycle) * baseRentWithBadge * 3600),
            hourly: (baseRentWithBadge * customSrbMultiplier * 3600) // Active Hour in SRB
        },
        constants: {
            adBoost: effectiveAdBoostMultiplier,
            badgeBoost: badgeInfo.boost,
            srbMultiplier: customSrbMultiplier,
            srbHoursPerMonth: customSrbHoursPerMonth,
            boostHoursPerDay: boostHoursPerDay
        }
    };
};

/**
 * Legacy compatibility wrappers
 */
export const calculateProfitWithBoostHours = (
    parcels: { common: number; rare: number; epic: number; legendary: number },
    badges: number,
    adBoostMultiplier: number,
    boostHoursPerDay: number
) => {
    // Redirect to new logic with standard 64h SRB assumption for simple views
    const detailed = calculateDetailedScenario(parcels, badges, boostHoursPerDay, false, 64, 50, adBoostMultiplier);
    return {
        daily: detailed.perDay.boosted, // Normal day boosted
        monthly: detailed.perMonth.boosted, // Weighted monthly
        yearly: detailed.perYear.boosted,   // Weighted yearly
        perSecondBoosted: detailed.perSecond.boosted,
        totalParcels: parcels.common + parcels.rare + parcels.epic + parcels.legendary,
        badgeLevel: getBadgeBoost(badges).level
    };
};

export const formatCurrency = (amount: number, precision: number = 2) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
    }).format(amount);
};

export const formatCurrencyHighPrecision = (amount?: number) => {
    // Adaptive precision: larger amounts need fewer decimal places
    if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
    
    let precision: number;
    if (Math.abs(amount) >= 1) precision = 2;
    else if (Math.abs(amount) >= 0.01) precision = 4;
    else if (Math.abs(amount) >= 0.0001) precision = 6;
    else if (Math.abs(amount) >= 0.000001) precision = 8;
    else precision = 10;
    
    return '$' + amount.toFixed(precision);
};

export const calculateTimeToGoal = (currentAmount: number, goalAmount: number, dailyIncome: number) => {
    const remaining = Math.max(0, goalAmount - currentAmount);
    const days = dailyIncome > 0 ? remaining / dailyIncome : Infinity;
    const weeks = days / 7;
    const months = days / 30;
    const years = days / 365;

    let formattedTime = '';
    if (days === Infinity) formattedTime = 'Nunca';
    else if (days < 1) formattedTime = 'Menos de 1 día';
    else if (days < 30) formattedTime = `${Math.ceil(days)} días`;
    else formattedTime = `${Math.ceil(months)} meses`;

    return { days, weeks, months, years, formattedTime };
};

export const compareScenarios = (
    parcels1: any, badges1: number, boost1: number, hours1: number,
    parcels2: any, badges2: number, boost2: number, hours2: number,
    label1: string, label2: string
) => {
    const r1 = calculateDetailedScenario(parcels1, badges1, hours1, false, 64, 50, boost1);
    const r2 = calculateDetailedScenario(parcels2, badges2, hours2, false, 64, 50, boost2);

    const dailyDiff = r2.perDay.avg - r1.perDay.avg;

    return {
        scenario1: { label: label1, dailyIncome: r1.perDay.avg, monthlyIncome: r1.perMonth.avg, yearlyIncome: r1.perYear.avg },
        scenario2: { label: label2, dailyIncome: r2.perDay.avg, monthlyIncome: r2.perMonth.avg, yearlyIncome: r2.perYear.avg },
        difference: {
            daily: dailyDiff,
            monthly: r2.perMonth.avg - r1.perMonth.avg,
            yearly: r2.perYear.avg - r1.perYear.avg,
            dailyPercentage: r1.perDay.avg > 0 ? (dailyDiff / r1.perDay.avg) * 100 : 0
        }
    };
};

export const calculateProfitAdvanced = (
    parcels: { common: number; rare: number; epic: number; legendary: number },
    badges: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _adBoost: number = 30
) => {
    const result = calculateProfitWithBoostHours(parcels, badges, getAdBoostMultiplier(parcels.common + parcels.rare + parcels.epic + parcels.legendary), 24);
    return {
        daily: result.daily,
        monthly: result.monthly,
        yearly: result.yearly,
        perSecondBoosted: result.perSecondBoosted
    };
};

// Note: PARCEL_COSTS and BADGE_COST are defined in distribution.ts
// and imported from there when needed for investment calculations.

/**
 * Average rent per second per parcel (weighted by prob)
 */
export const AVERAGE_PARCEL_RENT =
    (RENT_RATES.COMMON * 0.50) +
    (RENT_RATES.RARE * 0.30) +
    (RENT_RATES.EPIC * 0.15) +
    (RENT_RATES.LEGENDARY * 0.05);


/** 
 * Calculate requirements to reach a daily target
 */
export const calculateRequirementsForTarget = (
    dailyTarget: number,
    currentParcels: number,
    currentBadges: number,
    boostHoursPerDay: number = 24 // NEW: Use actual boost hours instead of hardcoded 24
) => {
    const badgeInfo = getBadgeBoost(currentBadges);
    const badgeMultiplier = 1 + badgeInfo.boost;

    let parcels = currentParcels;

    // Safety break
    while (parcels < 10000) {
        const adBoost = getAdBoostMultiplier(parcels);
        const avgRentPerSecond = AVERAGE_PARCEL_RENT * parcels;

        // Weighted average incorporating actual boost hours
        const boostedIncome = avgRentPerSecond * badgeMultiplier * adBoost * boostHoursPerDay * 3600;
        const unboostedIncome = avgRentPerSecond * badgeMultiplier * 1 * (24 - boostHoursPerDay) * 3600;
        const dailyIncome = boostedIncome + unboostedIncome;

        if (dailyIncome >= dailyTarget) {
            break;
        }
        parcels++;

        // Optimization: jump by larger steps if far away
        if (dailyTarget - dailyIncome > 1) parcels += 10;
    }

    return {
        parcels: parcels,
        badges: currentBadges,
        shortfallParcels: Math.max(0, parcels - currentParcels)
    };
};

/**
 * Next Milestone F2P
 */
export const F2P_STRATEGY_MILESTONES = [
    { parcels: 150, badges: 1, label: 'Top Tier 30x (150 Parcelas)' },
    { parcels: 150, badges: 11, label: 'Passport Level 2 (11 Badges / +10%)' },
    { parcels: 220, badges: 11, label: 'Saltar a Tier 20x (220 Parcelas)' },
    { parcels: 220, badges: 31, label: 'Passport Level 3 (31 Badges / +15%)' },
    { parcels: 290, badges: 31, label: 'Saltar a Tier 15x (290 Parcelas)' },
    { parcels: 290, badges: 61, label: 'Passport Level 4 (61 Badges / +20%)' },
    { parcels: 365, badges: 61, label: 'Saltar a Tier 12x (365 Parcelas)' },
    { parcels: 365, badges: 101, label: 'Passport Level 5 (101 Badges / +25% Max)' },
    { parcels: 435, badges: 101, label: 'Saltar a Tier 10x (435 Parcelas)' },
    { parcels: 545, badges: 101, label: 'Saltar a Tier 8x (545 Parcelas)' },
];

export const getNextMilestone = (currentParcels: number, currentBadges: number) => {
    const nextMilestone = F2P_STRATEGY_MILESTONES.find(
        m => m.parcels > currentParcels || (m.parcels === currentParcels && m.badges > currentBadges)
    );

    if (!nextMilestone) {
        return {
            description: `Maximizar Parcelas (Más de 545 Parcelas / Tier 7x+)`,
            parcelsNeeded: 0,
            badgesNeeded: 0,
            targetParcels: currentParcels,
            targetBadges: 101,
            abNeeded: 0
        };
    }

    const parcelsNeeded = Math.max(0, nextMilestone.parcels - currentParcels);
    const badgesNeeded = Math.max(0, nextMilestone.badges - currentBadges);
    const abNeeded = (parcelsNeeded * 100) + (badgesNeeded * 200);

    return {
        description: nextMilestone.label,
        parcelsNeeded,
        badgesNeeded,
        targetParcels: nextMilestone.parcels,
        targetBadges: nextMilestone.badges,
        abNeeded
    };
};

/**
 * Tier Jump Strategy Engine
 * Calculates the drop in income when crossing a tier without saving AB,
 * and the exact AB needed to jump safely to the next tier max.
 */
export const calculateTierJumpStrategy = (
    parcels: { common: number; rare: number; epic: number; legendary: number },
    badges: number,
    boostHours: number = 24
) => {
    const totalParcels = parcels.common + parcels.rare + parcels.epic + parcels.legendary;
    const currentTier = BOOST_TIERS.find(t => totalParcels <= t.max);
    
    if (!currentTier || currentTier.max === Infinity) {
        return null;
    }

    const targetMax = currentTier.max;
    const isAtMaxTier = totalParcels === targetMax;
    const nextTierMax = (BOOST_TIERS.find(t => t.max > targetMax)?.max) || (targetMax + 75);

    // Current daily profit at max of current tier
    const currentMaxProfit = calculateProfitWithBoostHours(
        parcels, badges, currentTier.multiplier, boostHours
    );

    // If user bought just 1 parcel over current tier boundary (e.g. 151 parcels)
    const overBoundaryParcels = { ...parcels, common: parcels.common + (targetMax + 1 - totalParcels) };
    const nextTierObj = BOOST_TIERS.find(t => (targetMax + 1) <= t.max);
    const nextTierMultiplier = nextTierObj ? nextTierObj.multiplier : 2;

    const droppedProfit = calculateProfitWithBoostHours(
        overBoundaryParcels, badges, nextTierMultiplier, boostHours
    );

    // How many parcels needed to reach next tier max in one jump
    const parcelsNeededForJump = nextTierMax - totalParcels;
    const abNeededForJump = parcelsNeededForJump * 100;

    return {
        currentMaxParcels: targetMax,
        isAtMaxTier,
        currentMultiplier: currentTier.multiplier,
        nextTierMultiplier,
        nextTierMax,
        parcelsNeededForJump,
        abNeededForJump,
        dailyIncomeCurrentMax: currentMaxProfit.daily,
        dailyIncomeDropped1Parcel: droppedProfit.daily,
        dropAmountDaily: Math.max(0, currentMaxProfit.daily - droppedProfit.daily)
    };
};

/**
 * Optimal Strategy (Dynamic Atlas Earth F2P Path)
 */
export const calculateOptimalStrategy = (
    _target: number,
    currentParcels: number,
    currentBadges: number
) => {
    const steps = F2P_STRATEGY_MILESTONES.map((m, index) => {
        // Average parcel distribution for estimation
        const avgParcels = {
            common: Math.round(m.parcels * 0.50),
            rare: Math.round(m.parcels * 0.30),
            epic: Math.round(m.parcels * 0.15),
            legendary: Math.round(m.parcels * 0.05)
        };

        const adBoost = getAdBoostMultiplier(m.parcels);
        const profit = calculateProfitWithBoostHours(avgParcels, m.badges, adBoost, 24);

        const isCompleted = currentParcels > m.parcels || (currentParcels === m.parcels && currentBadges >= m.badges);
        const isCurrent = !isCompleted && (
            index === 0 || (currentParcels >= F2P_STRATEGY_MILESTONES[index - 1].parcels)
        );

        return {
            step: index + 1,
            description: m.label,
            dailyIncome: profit.daily,
            parcels: m.parcels,
            badges: m.badges,
            isCompleted,
            isCurrent
        };
    });

    return { steps };
};

/**
 * Calculate Individual Parcel Type Efficiency
 */
export const calculateParcelEfficiency = (badges: number, boostHours: number = 24) => {
    const badgeBoost = getBadgeBoost(badges).boost;
    const badgeMult = 1 + badgeBoost;
    const dutyCycle = boostHours / 24;

    const calcType = (rate: number, boostMult: number) => {
        const baseSec = rate * badgeMult;
        const boostedSec = baseSec * boostMult;
        const avgDailySec = (boostedSec * dutyCycle) + (baseSec * (1 - dutyCycle));
        return {
            perSecond: boostedSec,
            daily: avgDailySec * 86400,
            monthly: avgDailySec * 86400 * (365 / 12),
            yearly: avgDailySec * 86400 * 365
        };
    };

    return {
        common: calcType(RENT_RATES.COMMON, 30),
        rare: calcType(RENT_RATES.RARE, 30),
        epic: calcType(RENT_RATES.EPIC, 30),
        legendary: calcType(RENT_RATES.LEGENDARY, 30),
    };
};

/**
 * Account Luck Score Analysis
 * Compares user's actual parcel distribution against standard official probabilities
 * (50% Common, 30% Rare, 15% Epic, 5% Legendary)
 */
export const calculateAccountLuckScore = (parcels: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
}) => {
    const total = parcels.common + parcels.rare + parcels.epic + parcels.legendary;

    if (total === 0) {
        return {
            totalParcels: 0,
            luckPercentage: 0,
            status: 'average' as const,
            expectedLegendary: 0,
            actualLegendary: 0,
            luckBonusDailyIncome: 0,
            message: 'Añade parcelas para analizar la suerte de tu perfil.'
        };
    }

    // Official probability distribution
    const expected = {
        common: total * 0.50,
        rare: total * 0.30,
        epic: total * 0.15,
        legendary: total * 0.05
    };

    // Calculate actual rent per second vs expected average rent per second
    const actualBaseRentPerSec = calculateBaseRentPerSecond(parcels);
    const expectedBaseRentPerSec = (
        expected.common * RENT_RATES.COMMON +
        expected.rare * RENT_RATES.RARE +
        expected.epic * RENT_RATES.EPIC +
        expected.legendary * RENT_RATES.LEGENDARY
    );

    const rentRatio = expectedBaseRentPerSec > 0 ? (actualBaseRentPerSec / expectedBaseRentPerSec) : 1;
    const luckPercentage = (rentRatio - 1) * 100;

    // Additional daily income generated purely by luck vs average luck
    const luckBonusDailyIncome = (actualBaseRentPerSec - expectedBaseRentPerSec) * 30 * 86400; // Assuming 30x boost

    let status: 'extraordinary' | 'above_average' | 'average' | 'below_average' | 'unlucky' = 'average';
    let message = 'Tu cuenta está perfectamente equilibrada en la probabilidad estándar.';

    if (luckPercentage >= 15) {
        status = 'extraordinary';
        message = '🔥 ¡Suerte Extraordinaria! Tienes una concentración de parcelas Raras/Épicas/Legendarias muy superior a la media.';
    } else if (luckPercentage >= 5) {
        status = 'above_average';
        message = '✨ Suerte por encima de la media. Tu portafolio genera más ingresos que una cuenta promedio.';
    } else if (luckPercentage <= -15) {
        status = 'unlucky';
        message = '📉 Suerte por debajo de la media. Tienes más parcelas Comunes de lo previsto estadísticamente.';
    } else if (luckPercentage <= -5) {
        status = 'below_average';
        message = '⚠️ Ligeramente por debajo del promedio. Se equilibrará conforme adquieras más parcelas.';
    }

    return {
        totalParcels: total,
        luckPercentage: parseFloat(luckPercentage.toFixed(1)),
        status,
        expectedLegendary: Math.round(expected.legendary),
        actualLegendary: parcels.legendary,
        luckBonusDailyIncome: parseFloat(luckBonusDailyIncome.toFixed(4)),
        message
    };
};

/**
 * Calculate ROI (Return On Investment)
 */
export const calculateROI = (
    parcels: { common: number; rare: number; epic: number; legendary: number },
    badges: number,
    adBoostMultiplier: number,
    boostHoursPerDay: number
) => {
    const totalParcels = parcels.common + parcels.rare + parcels.epic + parcels.legendary;
    const profit = calculateProfitWithBoostHours(parcels, badges, adBoostMultiplier, boostHoursPerDay);

    // Costs in USD (Approx $5 per parcel, $10 per badge/200AB)
    const investment = (totalParcels * 5) + (badges * 10);

    if (profit.daily <= 0) {
        return {
            daysToBreakEven: Infinity,
            monthsToBreakEven: Infinity,
            roi30Days: 0,
            roi365Days: 0,
            monthlyIncome: 0,
            yearlyIncome: 0
        };
    }

    const daysToBreakEven = investment / profit.daily;
    const monthsToBreakEven = daysToBreakEven / 30.41;

    // ROI = (Return / Investment) * 100
    const roi30Days = (profit.monthly / investment) * 100;
    const roi365Days = (profit.yearly / investment) * 100;

    return {
        daysToBreakEven,
        monthsToBreakEven,
        roi30Days,
        roi365Days,
        monthlyIncome: profit.monthly,
        yearlyIncome: profit.yearly
    };
};


