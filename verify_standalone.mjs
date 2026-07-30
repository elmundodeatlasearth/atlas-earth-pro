
// RENT RATES Directly from my proposed code
const RENT_RATES = {
    COMMON: 0.0000000011,
    RARE: 0.0000000016,
    EPIC: 0.0000000022,
    LEGENDARY: 0.0000000044,
};

// BOOST TIERS
const BOOST_TIERS = [
    { max: 150, multiplier: 30 },
    { max: 220, multiplier: 20 },
    { max: 290, multiplier: 15 },
    // ...
];

const calculateBaseRentPerSecond = (parcels: any) => {
    return (
        parcels.common * RENT_RATES.COMMON +
        parcels.rare * RENT_RATES.RARE +
        parcels.epic * RENT_RATES.EPIC +
        parcels.legendary * RENT_RATES.LEGENDARY
    );
};

const calculateDetailedScenario = (
    parcels: any,
    badges: number,
    boostHoursPerDay: number,
    forceSrb50x: boolean,
    customSrbHoursPerMonth: number,
    customSrbMultiplier: number,
    forcedAdBoostMultiplier: number
) => {
    const basePerSecond = calculateBaseRentPerSecond(parcels);
    const badgeMultiplier = 1.25; // 101 badges = 25%

    const baseRentWithBadge = basePerSecond * badgeMultiplier;

    // Effective Ad Boost
    const effectiveAdBoostMultiplier = forcedAdBoostMultiplier; // 15x

    const boostedRentPerSecond = baseRentWithBadge * effectiveAdBoostMultiplier;

    // Duty Cycle
    const dutyCycle = boostHoursPerDay / 24;
    const dailyBoostedHours = boostHoursPerDay;
    const dailyUnboostedHours = 24 - boostHoursPerDay;

    // Normal Day
    const dailyIncomeNormal =
        (baseRentWithBadge * effectiveAdBoostMultiplier * dailyBoostedHours * 3600) +
        (baseRentWithBadge * 1 * dailyUnboostedHours * 3600);

    // SRB Day
    const dailyIncomeSRB =
        (baseRentWithBadge * customSrbMultiplier * dailyBoostedHours * 3600) +
        (baseRentWithBadge * 1 * dailyUnboostedHours * 3600);

    // Averages
    const daysInMonth = 365 / 12; // 30.416666
    const srbDaysPerMonth = customSrbHoursPerMonth / 24; // 2.66666
    const normalDaysPerMonth = daysInMonth - srbDaysPerMonth;

    const monthlyIncomeWeighted =
        (dailyIncomeNormal * normalDaysPerMonth) +
        (dailyIncomeSRB * srbDaysPerMonth);

    const yearlyIncomeWeighted = monthlyIncomeWeighted * 12;
    const dailyIncomeWeightedAvg = yearlyIncomeWeighted / 365;

    return {
        perSecond: { base: baseRentWithBadge, boosted: boostedRentPerSecond },
        perDay: { avg: dailyIncomeWeightedAvg },
        perMonth: { avg: monthlyIncomeWeighted },
        perYear: { avg: yearlyIncomeWeighted },
        srb: {
            payPerEvent64h: (64 * dutyCycle * baseRentWithBadge * customSrbMultiplier * 3600) + (64 * (1 - dutyCycle) * baseRentWithBadge * 3600),
        }
    };
};

// TEST DATA
const parcels = { common: 106, rare: 80, epic: 28, legendary: 14 };
const badges = 101;
const boostHours = 16;
const srbHours = 64;

const result = calculateDetailedScenario(parcels, badges, boostHours, false, srbHours, 50, 15);

console.log("Per Second Base (Ref 0.000000461):", result.perSecond.base.toFixed(11));
console.log("Per Second Boost (Ref 0.000006917):", result.perSecond.boosted.toFixed(11));
console.log("Avg Day (Ref 0.493):", result.perDay.avg.toFixed(4));
console.log("Avg Month (Ref 15.003):", result.perMonth.avg.toFixed(4));
console.log("Avg Year (Ref 180.035):", result.perYear.avg.toFixed(4));
console.log("SRB 64h (Ref 5.3127):", result.srb.payPerEvent64h.toFixed(6));
