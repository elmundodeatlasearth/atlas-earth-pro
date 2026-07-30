/**
 * Token Bucket Rate Limiter
 * Provides client-side throttling for actions to prevent abuse before reaching the server.
 */
export class RateLimiter {
    private tokens: number;
    private maxTokens: number;
    private refillRate: number; // Tokens per second
    private lastRefill: number;

    constructor(maxTokens: number = 10, refillRate: number = 1) {
        this.tokens = maxTokens;
        this.maxTokens = maxTokens;
        this.refillRate = refillRate;
        this.lastRefill = Date.now();
    }

    tryConsume(cost: number = 1): boolean {
        this.refill();
        if (this.tokens >= cost) {
            this.tokens -= cost;
            return true;
        }
        return false;
    }

    private refill() {
        const now = Date.now();
        const elapsed = (now - this.lastRefill) / 1000;
        const newTokens = elapsed * this.refillRate;

        if (newTokens > 0) {
            this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
            this.lastRefill = now;
        }
    }

    getTokens(): number {
        this.refill();
        return this.tokens;
    }
}

// Singleton instance for global API calls
export const apiRateLimiter = new RateLimiter(5, 0.5); // 5 bursts, 1 every 2 seconds
