import pLimit from "p-limit";

import { logger } from "./logger";

/**
 * Elite Concurrency Manager
 * Responsible for protecting downstream AI providers from "Thundering Herd" 
 * problems and 429 Rate Limits.
 * 
 * Strategy:
 * - Priority separation: 'PRO' (High Reasoning) vs 'FLASH' (Fast) models.
 * - Jitter: Spreads requests arriving simultaneously to prevent bursting.
 * - Singleton: Single global state for the entire application.
 */
export class ConcurrencyManager {
    private static instance: ConcurrencyManager;

    // LIMITS CONFIGURATION (Adjustable based on Tier)
    // Gemini 1.5 Flash has higher limits (RPM/TPM) than Pro.
    // ELITE TIGHTENING: Lowered from 10 to 6 to better handle Free Tier (15 RPM)
    private readonly FLASH_CONCURRENCY = 2;
    private readonly PRO_CONCURRENCY = 2;

    // The actual queues
    private flashLimit = pLimit(this.FLASH_CONCURRENCY);
    private proLimit = pLimit(this.PRO_CONCURRENCY);

    // Metrics for debugging
    private activeRequests = 0;
    private queuedRequests = 0;

    // ELITE RATE LIMIT PROTECTION
    // Dynamic gap based on observed provider pressure.
    private readonly BASE_GAP_MS = 4200; // ~14 RPM (Standard Gemini/Elite)
    private readonly THROTTLED_GAP_MS = 20000; // ~3 RPM (Groq Free Tier/Exhaustion)
    private currentGap = this.BASE_GAP_MS;
    private throttleEndTime = 0;
    private lastRequestStartTime = 0;

    private constructor() { }

    public static getInstance(): ConcurrencyManager {
        if (!ConcurrencyManager.instance) {
            ConcurrencyManager.instance = new ConcurrencyManager();
        }
        return ConcurrencyManager.instance;
    }

    /**
     * Schedule an AI task.
     * @param task The async function that performs the AI call
     * @param isHighReasoning Set to true for 'Pro' or 'O1' models
     * @param onWait Optional callback for UI feedback during RPM throttle
     */
    public async schedule<T>(
        task: () => Promise<T>,
        isHighReasoning: boolean = false,
        onWait?: (ms: number) => void
    ): Promise<T> {
        const limiter = isHighReasoning ? this.proLimit : this.flashLimit;
        const modelLabel = isHighReasoning ? "PRO" : "FLASH";

        this.queuedRequests++;

        return limiter(async () => {
            this.queuedRequests--;
            this.activeRequests++;

            // ELITE RPM BOTTLENECK: Adaptive gap enforcement
            const now = performance.now();
            const timeSinceLast = now - this.lastRequestStartTime;

            // Revert throttle if time has passed
            if (this.currentGap > this.BASE_GAP_MS && Date.now() > this.throttleEndTime) {
                logger.info("[Concurrency] Throttling lifted. Reverting to base RPM gap.");
                this.currentGap = this.BASE_GAP_MS;
            }

            if (timeSinceLast < this.currentGap) {
                let waitTime = Math.round(this.currentGap - timeSinceLast);
                logger.debug(`[Concurrency] RPM Guard Active (${Math.round(this.currentGap)}ms gap): Waiting ${waitTime}ms.`);

                // ELITE FIX: Real-time countdown loop
                while (waitTime > 0) {
                    if (onWait) onWait(waitTime);
                    const step = Math.min(waitTime, 1000);
                    await new Promise(r => setTimeout(r, step));
                    waitTime -= step;

                    // Re-calculate since it might have drifted
                    // (Optional, but keeps it honest if the system is under heavy load)
                    const nowInner = performance.now();
                    waitTime = Math.round(this.currentGap - (nowInner - this.lastRequestStartTime));
                }
            }
            this.lastRequestStartTime = performance.now();

            const start = performance.now();
            try {
                // Execute the task
                return await task();
            } finally {
                this.activeRequests--;
                const duration = Math.round(performance.now() - start);

                // Elite Logging: Only log if slow or under pressure
                if (duration > 5000 || this.queuedRequests > 5) {
                    logger.debug(`[Concurrency] ${modelLabel} task done in ${duration}ms. (Active: ${this.activeRequests}, Queued: ${this.queuedRequests})`);
                }
            }
        });
    }

    /**
     * Signal a rate limit occurred.
     * Increases the gap globally for 5 minutes.
     */
    public signalRateLimit(): void {
        if (this.currentGap < this.THROTTLED_GAP_MS) {
            logger.warn(`[Concurrency] Rate limit signal received! Activating ${Math.round(this.THROTTLED_GAP_MS / 1000)}s RPM throttle.`);
            this.currentGap = this.THROTTLED_GAP_MS;
        }
        // Extended cooldown (5 minutes)
        this.throttleEndTime = Date.now() + (5 * 60 * 1000);
    }

    /**
     * Insights into current load for health checks or admin dashboards.
     */
    public getStats() {
        return {
            active: this.activeRequests,
            queued: this.queuedRequests,
            limits: {
                flash: this.FLASH_CONCURRENCY,
                pro: this.PRO_CONCURRENCY
            }
        };
    }
}

// Export singleton instance for direct use
export const concurrency = ConcurrencyManager.getInstance();
