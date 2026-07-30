import {
    calculateProfitWithBoostHours,
    getAdBoostMultiplier,
    getBadgeBoost,
    calculateAccountLuckScore,
    calculateTierJumpStrategy,
    formatCurrency,
    BOOST_TIERS
} from '../utils/calculations';
import type { UserData } from '../types';

export interface AIRecommendation {
    id: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: 'TIER' | 'BADGE' | 'BOOST' | 'GOAL';
    title: string;
    description: string;
    actionableStep: string;
    impact: string;
    abRequired?: number;
}

export interface AIAccountDiagnosis {
    healthScore: number; // 0 to 100
    profileRating: string;
    luckAnalysis: ReturnType<typeof calculateAccountLuckScore>;
    efficiencyPercent: number;
    currentDailyIncome: number;
    monthlyIncome: number;
    targetShortfallDaily: number;
    recommendations: AIRecommendation[];
    nextOptimalMove: string;
}

/**
 * AI Tactical Advisor Engine
 * Analyzes 100% of user profile data and computes personalized tactical advice.
 */
export const analyzeUserProfile = (
    userData: UserData,
    boostHours: number,
    dailyTarget: number
): AIAccountDiagnosis => {
    const totalParcels = userData.common + userData.rare + userData.epic + userData.legendary;
    const activeMultiplier = getAdBoostMultiplier(totalParcels);
    const profit = calculateProfitWithBoostHours(userData, userData.badges, activeMultiplier, boostHours);
    const luckAnalysis = calculateAccountLuckScore(userData);
    const tierJumpInfo = calculateTierJumpStrategy(userData, userData.badges, boostHours);
    const badgeInfo = getBadgeBoost(userData.badges);

    const shortfallDaily = Math.max(0, dailyTarget - profit.daily);

    // Calculate Health Score (0-100)
    // Factors: Boost duty cycle (max 40 pts), badge level (max 25 pts), tier positioning (max 20 pts), luck bonus (max 15 pts)
    const boostScore = Math.min(40, (boostHours / 24) * 40);
    const badgeScore = Math.min(25, (badgeInfo.level / 5) * 25);
    const tierScore = tierJumpInfo?.isAtMaxTier ? 20 : (totalParcels > 0 ? 15 : 5);
    const luckScoreBonus = Math.max(0, Math.min(15, 7.5 + luckAnalysis.luckPercentage / 2));
    
    const healthScore = Math.min(100, Math.round(boostScore + badgeScore + tierScore + luckScoreBonus));

    // Profile Rating Title
    let profileRating = 'Operador Novato';
    if (healthScore >= 90) profileRating = 'Comandante de Élite Táctico';
    else if (healthScore >= 75) profileRating = 'Estratega Experimentado';
    else if (healthScore >= 55) profileRating = 'Inversionista Eficiente';
    else if (healthScore >= 35) profileRating = 'Operativo En Desarrollo';

    const recommendations: AIRecommendation[] = [];

    // 1. Boost Hours Recommendation
    if (boostHours < 20) {
        const potentialIncome = calculateProfitWithBoostHours(userData, userData.badges, activeMultiplier, 24).daily;
        const lossDaily = potentialIncome - profit.daily;
        recommendations.push({
            id: 'rec_boost_hours',
            priority: 'HIGH',
            category: 'BOOST',
            title: 'Maximizar Horas de Boost Diario',
            description: `Actualmente mantienes ${boostHours}h de boost al día. Aumentar a 20-24h incrementará tus ganancias sin gastar dinero ni Atlas Bucks.`,
            actionableStep: 'Mantén el temporizador activo en la app oficial de Atlas Earth cada 1 hora.',
            impact: `+${formatCurrency(lossDaily * 30, 2)} USD por mes`
        });
    }

    // 2. Tier Drop Warning Recommendation
    if (tierJumpInfo?.isAtMaxTier) {
        recommendations.push({
            id: 'rec_tier_cap',
            priority: 'HIGH',
            category: 'TIER',
            title: `¡Alerta de Cierre de Tier! (${totalParcels} Parcelas)`,
            description: `Estás en el tope exacto del Tier (${tierJumpInfo.currentMaxParcels} parcelas a ${tierJumpInfo.currentMultiplier}x). Si compras 1 sola parcela extra, tu boost caerá a ${tierJumpInfo.nextTierMultiplier}x reduciendo tus ingresos diarios.`,
            actionableStep: `Ahorra exactamente ${tierJumpInfo.abNeededForJump.toLocaleString()} AB (${tierJumpInfo.parcelsNeededForJump} parcelas) antes de realizar tu siguiente compra.`,
            impact: `Previene pérdida diaria de -${formatCurrency(tierJumpInfo.dropAmountDaily, 3)} USD`,
            abRequired: tierJumpInfo.abNeededForJump
        });
    }

    // 3. Badge Progression Recommendation
    if (totalParcels >= 150 && userData.badges < 11) {
        const badgesNeeded = 11 - userData.badges;
        const abNeeded = badgesNeeded * 200;
        recommendations.push({
            id: 'rec_badges_lvl2',
            priority: 'HIGH',
            category: 'BADGE',
            title: 'Adquirir Insignias de Nivel 2 (+10% Boost Permanente)',
            description: `Con 150 parcelas ya alcanzaste el máximo rendimiento de Tier 30x. Comprar insignias otorga un multiplicador pasivo a toda tu renta.`,
            actionableStep: `Compra ${badgesNeeded} insignias en tu ciudad o viajes.`,
            impact: `+10% de renta diaria permanente`,
            abRequired: abNeeded
        });
    } else if (userData.badges < 1) {
        recommendations.push({
            id: 'rec_badge_first',
            priority: 'MEDIUM',
            category: 'BADGE',
            title: 'Comprar Primera Insignia (+5% Boost)',
            description: 'Obtener tu primera insignia activa el nivel 1 de pasaporte inmediatamente.',
            actionableStep: 'Compra 1 insignia por 200 AB.',
            impact: '+5% de boost permanente',
            abRequired: 200
        });
    }

    // 4. Target Daily Goal Strategy
    if (shortfallDaily > 0) {
        const parcelsNeededApprox = Math.ceil(shortfallDaily / 0.004); // Rough estimation
        recommendations.push({
            id: 'rec_goal_shortfall',
            priority: 'MEDIUM',
            category: 'GOAL',
            title: `Avanzar hacia la Meta de ${formatCurrency(dailyTarget)}/día`,
            description: `Te faltan ${formatCurrency(shortfallDaily, 3)}/día para alcanzar tu objetivo configurado.`,
            actionableStep: `Sigue la ruta óptima acumulando aproximadamente ${parcelsNeededApprox * 100} AB.`,
            impact: `Cumplimiento total de la meta`
        });
    }

    // Next Optimal Move summary
    let nextOptimalMove = 'Sigue acumulando Atlas Bucks de anuncios gratuitos y ruedas de la fortuna.';
    if (recommendations.length > 0) {
        nextOptimalMove = recommendations[0].description;
    }

    return {
        healthScore,
        profileRating,
        luckAnalysis,
        efficiencyPercent: Math.min(100, Math.round((profit.daily / (dailyTarget || 1)) * 100)),
        currentDailyIncome: profit.daily,
        monthlyIncome: profit.monthly,
        targetShortfallDaily: shortfallDaily,
        recommendations,
        nextOptimalMove
    };
};

/**
 * Tactical AI Query Engine
 * Answers custom or preset tactical questions based on 100% real user data.
 */
export const answerTacticalQuery = (
    queryKey: string,
    userData: UserData,
    boostHours: number,
    dailyTarget: number
): { title: string; answer: string; tacticalAdvice: string } => {
    const totalParcels = userData.common + userData.rare + userData.epic + userData.legendary;
    const activeMultiplier = getAdBoostMultiplier(totalParcels);
    const profit = calculateProfitWithBoostHours(userData, userData.badges, activeMultiplier, boostHours);
    const luckAnalysis = calculateAccountLuckScore(userData);
    const tierJumpInfo = calculateTierJumpStrategy(userData, userData.badges, boostHours);

    switch (queryKey) {
        case 'should_buy_badges': {
            if (totalParcels < 150) {
                const parcelsTo150 = 150 - totalParcels;
                return {
                    title: '¿Conviene comprar insignias ahora?',
                    answer: `La IA recomienda enfocarte en comprar ${parcelsTo150} parcelas más antes de comprar insignias masivamente.`,
                    tacticalAdvice: `Llegar a 150 parcelas otorga el máximo retorno por Atlas Buck gastado (Tier 30x). Adquiere máximo 1 insignia por ahora si estás viajando.`
                };
            } else if (userData.badges < 11) {
                return {
                    title: '¿Conviene comprar insignias ahora?',
                    answer: '¡SÍ, TOTALMENTE RECOMENDADO!',
                    tacticalAdvice: `Estás en ${totalParcels} parcelas (Tier 30x cap). Comprar insignias hasta llegar a 11 (+10%) es la mejor inversión antes de saltar a 220 parcelas.`
                };
            } else {
                return {
                    title: '¿Conviene comprar insignias ahora?',
                    answer: `Evalúa tu próximo salto de Tier.`,
                    tacticalAdvice: `Actualmente tienes ${userData.badges} insignias. Si estás cerca de viajar a nuevas ciudades, compra insignias hasta 31 (+15%). De lo contrario, ahorra AB para saltar de 220 a 290 parcelas.`
                };
            }
        }

        case 'tier_jump_timing': {
            if (!tierJumpInfo) {
                return {
                    title: '¿Cuándo debo saltar de Tier?',
                    answer: 'Actualmente estás en una etapa de crecimiento libre.',
                    tacticalAdvice: 'Compra parcelas libremente hasta llegar a 150 parcelas.'
                };
            }
            if (tierJumpInfo.isAtMaxTier) {
                return {
                    title: '¿Cuándo debo saltar de Tier?',
                    answer: `¡NO COMPRES HASTA JUNTAR ${tierJumpInfo.abNeededForJump.toLocaleString()} AB!`,
                    tacticalAdvice: `Estás exactamente en el tope (${totalParcels} parcelas). No compres parcelas de una en una. Junta ${tierJumpInfo.parcelsNeededForJump} parcelas (${tierJumpInfo.abNeededForJump} AB) y realiza el salto a ${tierJumpInfo.nextTierMax} parcelas de un solo golpe.`
                };
            } else {
                const remainingToCap = tierJumpInfo.currentMaxParcels - totalParcels;
                return {
                    title: '¿Cuándo debo saltar de Tier?',
                    answer: `Puedes comprar ${remainingToCap} parcelas más sin riesgo.`,
                    tacticalAdvice: `Tu tope actual es de ${tierJumpInfo.currentMaxParcels} parcelas (${tierJumpInfo.currentMultiplier}x). Compra ${remainingToCap} parcelas libremente antes de detenerte a ahorrar.`
                };
            }
        }

        case 'luck_score_eval': {
            return {
                title: '¿Qué tan buena es la suerte de mi cuenta?',
                answer: `Tu puntaje de suerte es ${luckAnalysis.luckPercentage > 0 ? '+' : ''}${luckAnalysis.luckPercentage}% (${luckAnalysis.status.toUpperCase()}).`,
                tacticalAdvice: `${luckAnalysis.message} Generas ${formatCurrency(Math.abs(luckAnalysis.luckBonusDailyIncome), 4)}/día ${luckAnalysis.luckPercentage >= 0 ? 'extra' : 'menos'} comparado con la suerte estadística estándar.`
            };
        }

        case 'reach_goal_fastest': default: {
            const shortfall = Math.max(0, dailyTarget - profit.daily);
            if (shortfall === 0) {
                return {
                    title: '¿Cómo acelerar mi meta diaria?',
                    answer: '¡Felicidades! Ya alcanzaste o superaste tu meta diaria.',
                    tacticalAdvice: `Tu meta de ${formatCurrency(dailyTarget)}/día está cubierta. Puedes subir tu meta a un nivel superior.`
                };
            }
            return {
                title: '¿Cómo alcanzar mi meta más rápido?',
                answer: `Te faltan ${formatCurrency(shortfall, 3)}/día para alcanzar $${dailyTarget.toFixed(2)}/día.`,
                tacticalAdvice: `La ruta optimizada por IA es: 1) Mantener 24h de boost activo. 2) Llegar a 150 parcelas. 3) Comprar 11 insignias. 4) Ahorrar para saltos de tier masivos.`
            };
        }
    }
};
