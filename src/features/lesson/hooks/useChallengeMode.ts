import { useCallback, useState } from 'react';

import { Challenge, TutorService } from '../api/TutorService';

export const useChallengeMode = (context: string, componentType: string) => {
    const [isActive, setIsActive] = useState(false);
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    // 1. Start: Get a "broken" model
    const startChallenge = useCallback(async () => {
        setIsLoading(true);
        setIsActive(true);
        setFeedback(null);

        try {
            const data = await TutorService.generateChallenge(context, componentType);
            setChallenge(data);
            return data.brokenConfig; // Returns the config to update the component
        } catch (e) {
            console.error(e);
            setIsActive(false);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [context, componentType]);

    // 2. Validate: Check if the student fixed it
    const validateSolution = useCallback(async (fixedConfig: Record<string, number>) => {
        if (!challenge) return;

        setIsLoading(true);
        setFeedback(null); // Clear previous feedback

        try {
            const result = await TutorService.analyzeInteraction(
                `CHALLENGE DOEL: ${challenge.goal}. SCENARIO: ${challenge.scenario}`,
                fixedConfig,
                componentType,
                true
            );
            setFeedback(result);
        } catch (e) {
            console.error(e);
            setFeedback("Er ging iets mis bij de controle. Probeer het nog eens.");
        } finally {
            setIsLoading(false);
        }
    }, [challenge, componentType]);

    const stopChallenge = useCallback(() => {
        setIsActive(false);
        setChallenge(null);
        setFeedback(null);
    }, []);

    return {
        isActive,
        isLoading,
        challenge,
        feedback,
        startChallenge,
        validateSolution,
        stopChallenge
    };
};
