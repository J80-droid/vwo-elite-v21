import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

// Data structuur voor een statische vraag
export interface StaticQuestion {
    id: string;
    question: string;
    answer: string;
    context: string;
    solutionSteps?: string[];
    explanation?: string;
    acceptedAnswers?: string[]; // Synoniemen (bijv. "ader" en "venen")
    imageUrl?: string;
}

// De database (hier laden we straks alle vragen in)
export const STATIC_QUESTIONS: Record<string, Record<number, StaticQuestion[]>> = {};

// Helper om synoniemen te checken
const checkAnswer = (input: string, correct: string, accepted: string[] = []) => {
    const normalize = (s: string) => s.trim().toLowerCase().replace(/[.,]/g, "");
    const cleanInput = normalize(input);
    if (cleanInput === normalize(correct)) return true;
    return accepted.some((acc) => normalize(acc).includes(cleanInput) || cleanInput.includes(normalize(acc)) || normalize(acc) === cleanInput);
};

export const createStaticEngine = (
    id: string,
    name: string,
    description: string,
    dataSetId: string, // De key in STATIC_QUESTIONS
): GymEngine => {
    return {
        id,
        name,
        description,

        generate: async (difficulty: Difficulty): Promise<GymProblem> => {
            const level = difficulty as number;
            const domainQuestions = STATIC_QUESTIONS[dataSetId];
            const pool = domainQuestions?.[level] || domainQuestions?.[1] || [];

            // 1. Try Local Pool
            if (pool.length > 0) {
                const q = pool[Math.floor(Math.random() * pool.length)]!;
                return {
                    id: `${dataSetId}-${level}-${Date.now()}-${Math.random()}`,
                    question: q.question,
                    answer: q.answer,
                    context: q.context,
                    solutionSteps: q.solutionSteps,
                    explanation: q.explanation,
                    imageUrl: q.imageUrl,
                    acceptedAnswers: q.acceptedAnswers,
                };
            }

            // 2. Default to AI Generation (God Mode)
            // If no static questions exist, we ask the AI to generate some on the fly.
            console.log(`[Gym] Local pool empty for ${dataSetId}, requesting AI generation...`);

            try {
                // Dynamically import to avoid circular dep if needed, or just standard import
                const { AIGymService } = await import("@features/ai/api/AIGymService");

                const questions = await AIGymService.generateQuestions({
                    topic: name,
                    context: description,
                    count: 1, // Just get one fresh one for now to keep it snappy
                    difficulty: level
                });

                if (questions.length > 0) {
                    const q = questions[0]!;

                    // Optional: Cache this new question continuously into the static pool? 
                    // For now, we just serve it.

                    return {
                        ...q,
                        // Ensure ID is unique
                        id: `ai-${dataSetId}-${Date.now()}`
                    };
                }
            } catch (err) {
                console.error("AI Generation failed:", err);
            }

            // 3. Fallback if AI fails
            return {
                id: "empty",
                question: "De AI kon geen nieuwe vraag genereren. Probeer het later.",
                answer: "...",
                context: "Offline Mode",
            };
        },

        validate: (input: string, problem: GymProblem) => {
            const isCorrect = checkAnswer(input, problem.answer, problem.acceptedAnswers);

            return {
                correct: isCorrect,
                feedback: isCorrect
                    ? "Correct!"
                    : `Helaas, het antwoord was: ${problem.answer}`,
            };
        },
    };
};
