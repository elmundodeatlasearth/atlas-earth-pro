
import { calculateDetailedScenario, RENT_RATES } from './src/utils/calculations';

// User Data from Image
const parcels = {
    common: 106,
    rare: 80,
    epic: 28,
    legendary: 14
};
const badges = 101; // 25% boost
const boostHours = 16; // 16h boost per image
const srbHours = 64; // srb setting

console.log("--- DEBUGGING EXACT RATES ---");
console.log("Rent Rates Used:", RENT_RATES);

const result = calculateDetailedScenario(
    parcels,
    badges,
    boostHours,
    false,
    srbHours,
    50, // SRB Multiplier
    15 // Tier Multiplier for 228 parcels
);

console.log("\n--- RESULTS vs IMAGE TARGETS ---");
console.log("Per Second Base (Target: ~$0.00000046118):", result.perSecond.base.toFixed(11));
console.log("Per Second Boosted (Target: ~$0.00000691763):", result.perSecond.boosted.toFixed(11));
console.log("avg Per Day (Target: $0.493):", result.perDay.avg.toFixed(4));
console.log("Per Month Avg (Target: ~$15.003):", result.perMonth.avg.toFixed(4));
console.log("Per Year Avg (Target: ~$180.035):", result.perYear.avg.toFixed(3));

console.log("\n--- SRB EVENTS ---");
console.log("Pay Per 64h Event (Target: ~$5.3127):", result.srb.payPerEvent64h.toFixed(4));
