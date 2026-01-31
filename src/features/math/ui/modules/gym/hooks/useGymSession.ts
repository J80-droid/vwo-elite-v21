import { useCallback, useEffect, useReducer, useRef } from "react";
import { useGymSound } from "@features/physics";
import { GymRepository } from "@shared/api/repositories/GymRepository";
import { GymModuleConfig } from "../types/config";
import { Difficulty, GymEngine } from "../types";
import { gymReducer, initialState, TIME_LIMIT_MS } from "./gymSessionReducer";

export const useGymSession = (
    engineId: string,
    engine: GymEngine | undefined,
    _gymConfig: GymModuleConfig | undefined,
    questionCount: number
) => {
    const [state, dispatch] = useReducer(gymReducer, initialState);
    const { playCorrect, playWrong } = useGymSound();

    // Refs voor veilige async executie
    const isMounted = useRef(true);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const seenQuestionsRef = useRef<Set<string>>(new Set());

    // Define Handlers FIRST so they can be used in effects
    const handleSubmit = useCallback(async (manualInput?: string, isTimeout = false) => {
        if (!engine || !state.activeProblem.data) return;

        const inputToCheck = manualInput ?? state.activeProblem.input;
        const timeTaken = Date.now() - state.session.startTime;

        let correct = false;
        let feedback = "Tijd is op!";

        if (!isTimeout) {
            const res = engine.validate(inputToCheck, state.activeProblem.data);
            correct = res.correct;
            feedback = res.feedback || (correct ? "Correct!" : "Fout");
        }

        // Score berekening
        let score = 0;
        if (correct && !state.activeProblem.isRetry) {
            const remainingSec = Math.max(0, Math.floor((TIME_LIMIT_MS - timeTaken) / 1000));
            score = 100 + remainingSec;
            if (timeTaken < 10000) score = Math.floor(score * 1.5);
        }

        // Context voor metrics
        const metricContext = {
            question: state.activeProblem.data.question,
            answer: state.activeProblem.data.answer,
            input: inputToCheck
        };

        // Side Effects
        if (correct) {
            playCorrect();
            GymRepository.saveResult(
                engineId,
                "general",
                true,
                timeTaken,
                score,
                { ...metricContext }
            ).catch(e => console.error("Save failed", e));

            setTimeout(() => {
                if (isMounted.current) dispatch({ type: "NEXT_PROBLEM" });
            }, 1000);
        } else {
            playWrong();
            GymRepository.saveResult(
                engineId,
                "general",
                false,
                timeTaken,
                0,
                {
                    ...metricContext,
                    errorType: isTimeout ? 'timeout' : 'wrong_answer'
                }
            ).catch(e => console.error("Save fail", e));
        }

        dispatch({
            type: "SUBMIT_RESULT",
            payload: { isCorrect: correct, feedback, timeTaken, scoreDelta: score }
        });
    }, [state.activeProblem, state.session.startTime, engine, engineId, playCorrect, playWrong]);

    // 1. Initialisatie
    useEffect(() => {
        isMounted.current = true;
        const loadLevel = async () => {
            const lvl = await GymRepository.getLevel(engineId);
            if (isMounted.current) {
                dispatch({ type: "INIT_SESSION", payload: { level: lvl } });
            }
        };
        loadLevel();
        return () => {
            isMounted.current = false;
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [engineId]);

    // 2. Vraag Generator
    useEffect(() => {
        // Correct logic: if NOT loading, stop. (Covers idle, validating, finished)
        if (state.status !== "loading") return;

        if (state.session.questionNumber > questionCount) {
            dispatch({ type: "FINISH_SESSION" });
            return;
        }

        const fetchProblem = async () => {
            if (!engine) return;

            let newProb;
            let attempts = 0;
            do {
                // Cast number to Difficulty (1|2|3|4|5)
                const diff = Math.min(5, Math.max(1, state.level.current)) as Difficulty;
                newProb = await engine.generate(diff);
                attempts++;
            } while (
                newProb &&
                seenQuestionsRef.current.has(newProb.question) &&
                attempts < 15
            );

            if (newProb) {
                seenQuestionsRef.current.add(newProb.question);
                if (isMounted.current) {
                    dispatch({ type: "LOAD_PROBLEM_SUCCESS", payload: { problem: newProb } });
                }
            }
        };
        fetchProblem();
    }, [state.status, state.session.questionNumber, engine, state.level, questionCount]);

    // 3. Timer Logic
    useEffect(() => {
        if (state.status !== "idle" || state.activeProblem.submissionStatus === "correct") {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            if (!isMounted.current) return;

            const elapsed = Date.now() - state.session.startTime;
            const remaining = Math.max(0, TIME_LIMIT_MS - elapsed);

            if (remaining <= 0) {
                handleSubmit(undefined, true);
                if (timerRef.current) clearInterval(timerRef.current);
            } else {
                dispatch({ type: "TICK_TIMER", payload: { timeLeft: remaining } });
            }
        }, 100);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [state.status, state.session.startTime, state.activeProblem.submissionStatus, handleSubmit]);

    const handleShowSolution = () => {
        dispatch({ type: "SHOW_SOLUTION_START" });
        setTimeout(() => {
            if (isMounted.current) dispatch({ type: "SHOW_SOLUTION_SUCCESS", payload: { steps: undefined } });
        }, 1500);
    };

    return {
        state,
        actions: {
            setInput: (val: string) => dispatch({ type: "SET_INPUT", payload: val }),
            handleSubmit,
            handleShowSolution,
            nextProblem: () => dispatch({ type: "NEXT_PROBLEM" }),
            handleFeedbackSubmit: (type: string, sentiment: string) => {
                console.log("Feedback submitted", type, sentiment);
                dispatch({ type: "CLOSE_ERROR_FEEDBACK" });
            }
        }
    };
};
