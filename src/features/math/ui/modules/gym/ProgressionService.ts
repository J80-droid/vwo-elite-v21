import { executeQuery } from "@shared/api/sqliteService";

import { GYM_IDS } from "./config/constants"; // Importeer de IDs

export const ProgressionService = {
    /**
     * Evaluates if new modules should be unlocked based on progress.
     */
    checkUnlocks: async (engineId: string, newLevel: number) => {
        // Math B Progression Chain
        // Gebruik de constanten in plaats van hardcoded strings
        if (engineId === GYM_IDS.FRACTIONS && newLevel >= 3) {
            await ProgressionService.unlockModule(GYM_IDS.DERIVS, "Beheersing van breuken ontgrendelt Differentiëren.");
        }

        if (engineId === GYM_IDS.DERIVS && newLevel >= 3) {
            await ProgressionService.unlockModule(GYM_IDS.INTEGRAAL, "Beheersing van afgeleiden ontgrendelt Integralen.");
        }

        // Physics Progression Chain
        if (engineId === GYM_IDS.UNITS && newLevel >= 2) {
            await ProgressionService.unlockModule(GYM_IDS.SIGFIG, "Eenheden beheerst? Tijd voor Significantie.");
        }

        // Add more logic-driven unlocks here...
    },

    /**
     * Internal helper to perform the unlock in DB.
     */
    unlockModule: async (moduleId: string, reason?: string) => {
        try {
            await executeQuery(
                `
        INSERT INTO module_unlocks (module_id, is_unlocked, completed_at)
        VALUES (?, 1, ?)
        ON CONFLICT(module_id) DO NOTHING
        `,
                [moduleId, Date.now()],
            );
            if (reason) {
                console.log(`[Progression] Unlocked ${moduleId}: ${reason}`);
            }
        } catch (e) {
            console.error(`[Progression] Failed to unlock ${moduleId}:`, e);
        }
    }
};
