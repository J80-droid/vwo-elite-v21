const FIRST_RUN_KEY = "vwo_elite_god_mode_v7_0_REBORN";

/**
 * Checks if this is the first run of the app (after fresh install)
 */
export const isFirstRun = (): boolean => {
    return localStorage.getItem(FIRST_RUN_KEY) !== "true";
};

/**
 * Marks first run as complete
 */
export const markFirstRunComplete = (): void => {
    localStorage.setItem(FIRST_RUN_KEY, "true");
};
