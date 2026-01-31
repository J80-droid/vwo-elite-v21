import { GymSessionState, GymAction } from "./GymSessionTypes";

export const TIME_LIMIT_MS = 60000;

export const initialState: GymSessionState = {
    status: "loading",
    level: { current: 1, maxUnlocked: 1 },
    session: { score: 0, questionNumber: 1, results: [], startTime: Date.now(), timeLeft: TIME_LIMIT_MS },
    activeProblem: { data: null, input: "", attempts: 0, isRetry: false, feedback: null, submissionStatus: "idle" },
    ui: { showSolution: false, isSolvingAI: false, showErrorFeedback: false },
};

export function gymReducer(state: GymSessionState, action: GymAction): GymSessionState {
    switch (action.type) {
        case "INIT_SESSION":
            return {
                ...state,
                level: { current: action.payload.level, maxUnlocked: action.payload.level },
                status: "loading" // Trigger effect om eerste vraag te laden
            };

        case "LOAD_PROBLEM_START":
            return { ...state, status: "loading" };

        case "LOAD_PROBLEM_SUCCESS":
            return {
                ...state,
                status: "idle",
                session: { ...state.session, startTime: Date.now(), timeLeft: TIME_LIMIT_MS },
                activeProblem: {
                    data: action.payload.problem,
                    input: "",
                    attempts: 0,
                    isRetry: false,
                    feedback: null,
                    submissionStatus: "idle"
                },
                ui: { ...state.ui, showSolution: false, showErrorFeedback: false }
            };

        case "SET_INPUT":
            // Blokkeer input als we aan het valideren zijn of klaar zijn (behalve bij fout)
            if (state.status !== "idle" && state.activeProblem.submissionStatus !== "wrong") return state;
            return {
                ...state,
                activeProblem: { ...state.activeProblem, input: action.payload }
            };

        case "SUBMIT_RESULT":
            // eslint-disable-next-line no-case-declarations
            const { isCorrect, feedback, scoreDelta, timeTaken } = action.payload;

            // eslint-disable-next-line no-case-declarations
            const newResult = {
                question: state.activeProblem.data?.question || "",
                userAnswer: state.activeProblem.input,
                correctAnswer: state.activeProblem.data?.answer || "",
                isCorrect,
                timeTaken,
                score: scoreDelta
            };

            if (isCorrect) {
                return {
                    ...state,
                    session: {
                        ...state.session,
                        score: state.session.score + scoreDelta,
                        results: [...state.session.results, newResult]
                    },
                    activeProblem: {
                        ...state.activeProblem,
                        submissionStatus: "correct",
                        feedback
                    }
                    // Note: De hook handelt de timeout naar NEXT_PROBLEM af
                };
            } else {
                return {
                    ...state,
                    activeProblem: {
                        ...state.activeProblem,
                        submissionStatus: "wrong",
                        attempts: state.activeProblem.attempts + 1,
                        feedback
                    },
                    session: { ...state.session, results: [...state.session.results, newResult] }
                };
            }

        case "SHOW_SOLUTION_START":
            return {
                ...state,
                activeProblem: { ...state.activeProblem, isRetry: true }, // Vanaf nu is het een retry (0 punten)
                ui: { ...state.ui, showSolution: true, isSolvingAI: true }
            };

        case "SHOW_SOLUTION_SUCCESS":
            return {
                ...state,
                activeProblem: {
                    ...state.activeProblem,
                    data: state.activeProblem.data ? { ...state.activeProblem.data, stepSolverResult: action.payload.steps } : null
                },
                ui: { ...state.ui, isSolvingAI: false }
            };

        case "NEXT_PROBLEM":
            return {
                ...state,
                session: { ...state.session, questionNumber: state.session.questionNumber + 1 },
                status: "loading" // Dit triggert de useEffect in de hook om nieuwe vraag te halen
            };

        case "FINISH_SESSION":
            return { ...state, status: "finished" };

        case "TICK_TIMER":
            // Alleen updaten als we nog bezig zijn
            if (state.activeProblem.submissionStatus === "correct") return state;
            return { ...state, session: { ...state.session, timeLeft: action.payload.timeLeft } };

        case "OPEN_ERROR_FEEDBACK":
            return { ...state, ui: { ...state.ui, showErrorFeedback: true } };

        case "CLOSE_ERROR_FEEDBACK":
            return { ...state, ui: { ...state.ui, showErrorFeedback: false } };

        default:
            return state;
    }
}
