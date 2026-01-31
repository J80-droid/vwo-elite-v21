import { GymProblem, SessionResult } from "../types";

// 1. De State Structuur
export interface GymSessionState {
    status: "loading" | "idle" | "validating" | "finished"; // Hoofdstatus machine

    // Progressie Data
    level: { current: number; maxUnlocked: number };
    session: {
        score: number;
        questionNumber: number;
        results: SessionResult[];
        startTime: number; // Tijdstip start huidige vraag
        timeLeft: number;
    };

    // Huidige Vraag Context
    activeProblem: {
        data: GymProblem | null;
        input: string;
        attempts: number;
        isRetry: boolean;
        feedback: string | null;
        submissionStatus: "idle" | "correct" | "wrong"; // Sub-status voor UI feedback
    };

    // UI Flags
    ui: {
        showSolution: boolean;
        isSolvingAI: boolean; // Voor de AI step solver
        showErrorFeedback: boolean;
    };
}

// 2. De Acties (Events)
export type GymAction =
    | { type: "INIT_SESSION"; payload: { level: number } }
    | { type: "LOAD_PROBLEM_START" }
    | { type: "LOAD_PROBLEM_SUCCESS"; payload: { problem: GymProblem } }
    | { type: "SET_INPUT"; payload: string }
    | { type: "TICK_TIMER"; payload: { timeLeft: number } }
    | { type: "SUBMIT_RESULT"; payload: { isCorrect: boolean; feedback: string; timeTaken: number; scoreDelta: number } }
    | { type: "SHOW_SOLUTION_START" }
    | { type: "SHOW_SOLUTION_SUCCESS"; payload: { steps?: any } } // StepSolver result
    | { type: "NEXT_PROBLEM" }
    | { type: "FINISH_SESSION" }
    | { type: "OPEN_ERROR_FEEDBACK" }
    | { type: "CLOSE_ERROR_FEEDBACK" };
