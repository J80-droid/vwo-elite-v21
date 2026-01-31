import {
    getRandomMolecule,
    mirrorMolecule,
    rotateMolecule,
    type Molecule
} from "@shared/assets/data/molecules";
import { create } from "zustand";

export interface Question {
    type: "same-or-enantiomer";
    targetMolecule: Molecule;
    optionMolecule: Molecule;
    isEnantiomer: boolean;
    correctAnswer: "same" | "enantiomer";
}

export type GameMode = "identifier" | "fischer-builder";

interface StereoState {
    mode: GameMode;
    question: Question | null;
    score: number;
    round: number;
    feedback: "correct" | "wrong" | null;
    gameOver: boolean;
    gameStarted: boolean;
    difficulty: "easy" | "medium" | "hard";
    showLabels: boolean;
    userRS: "R" | "S" | null;
    fischerChallengeMol: Molecule | null;
    userMolecules: Molecule[];
    selectedUserMolecule: Molecule | null;
    showMyMolecules: boolean;
    soundEnabled: boolean;

    // Actions
    setMode: (mode: GameMode) => void;
    setDifficulty: (diff: "easy" | "medium" | "hard") => void;
    setSelectedUserMolecule: (mol: Molecule | null) => void;
    setUserMolecules: (mols: Molecule[]) => void;
    setShowMyMolecules: (show: boolean) => void;
    setSoundEnabled: (enabled: boolean) => void;
    setUserRS: (rs: "R" | "S" | null) => void;
    setFeedback: (f: "correct" | "wrong" | null) => void;
    setGameStarted: (started: boolean) => void;

    startGame: () => void;
    generateQuestion: () => void;
    generateFischerChallenge: () => void;
    handleAnswer: (answer: "same" | "enantiomer") => void;
    checkFischer: () => void;
    nextRound: () => void;
    advanceRound: () => void;
}

export const MAX_ROUNDS_IDENTIFIER = 10;
export const MAX_ROUNDS_FISCHER = 5;

export const useStereoStore = create<StereoState>((set, get) => ({
    mode: "identifier",
    question: null,
    score: 0,
    round: 1,
    feedback: null,
    gameOver: false,
    gameStarted: false,
    difficulty: "easy",
    showLabels: true,
    userRS: null,
    fischerChallengeMol: null,
    userMolecules: [],
    selectedUserMolecule: null,
    showMyMolecules: false,
    soundEnabled: true,

    setMode: (mode) => set({ mode }),
    setDifficulty: (difficulty) => set({ difficulty }),
    setSelectedUserMolecule: (selectedUserMolecule) => set({ selectedUserMolecule }),
    setUserMolecules: (userMolecules) => set({ userMolecules }),
    setShowMyMolecules: (showMyMolecules) => set({ showMyMolecules }),
    setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
    setUserRS: (userRS) => set({ userRS }),
    setFeedback: (feedback) => set({ feedback }),
    setGameStarted: (gameStarted) => set({ gameStarted }),

    startGame: () => {
        const { mode, generateQuestion, generateFischerChallenge } = get();
        set({
            gameStarted: true,
            score: 0,
            round: 1,
            gameOver: false,
            feedback: null,
            userRS: null,
        });
        if (mode === "identifier") {
            generateQuestion();
        } else {
            generateFischerChallenge();
        }
    },

    generateQuestion: () => {
        const { difficulty, selectedUserMolecule } = get();
        const baseMolecule = selectedUserMolecule || getRandomMolecule(difficulty);
        const isEnantiomer = Math.random() > 0.5;
        const rotX = Math.random() * Math.PI * 2;
        const rotY = Math.random() * Math.PI * 2;
        const rotZ = Math.random() * Math.PI * 2;

        let optionMolecule: Molecule;
        if (isEnantiomer) {
            optionMolecule = rotateMolecule(mirrorMolecule(baseMolecule, 0), rotX, rotY, rotZ);
        } else {
            optionMolecule = rotateMolecule(baseMolecule, rotX, rotY, rotZ);
        }

        set({
            question: {
                type: "same-or-enantiomer",
                targetMolecule: baseMolecule,
                optionMolecule,
                isEnantiomer,
                correctAnswer: isEnantiomer ? "enantiomer" : "same",
            },
        });
    },

    generateFischerChallenge: () => {
        const { difficulty, selectedUserMolecule } = get();
        const base = selectedUserMolecule || getRandomMolecule(difficulty);
        set({ fischerChallengeMol: base, userRS: null });
    },

    handleAnswer: (answer) => {
        const { question, feedback, mode, generateQuestion } = get();
        if (feedback || !question) return;

        const isCorrect = answer === question.correctAnswer;
        const maxRounds = mode === "identifier" ? MAX_ROUNDS_IDENTIFIER : MAX_ROUNDS_FISCHER;

        if (isCorrect) {
            set((s) => ({ feedback: "correct", score: s.score + 1 }));
            setTimeout(() => {
                const { round: currentRound } = get();
                if (currentRound >= maxRounds) {
                    set({ gameOver: true });
                } else {
                    set({ round: currentRound + 1, feedback: null });
                    generateQuestion();
                }
            }, 800);
        } else {
            set({ feedback: "wrong" });
        }
    },

    checkFischer: () => {
        const { fischerChallengeMol, userRS, feedback, mode, generateFischerChallenge } = get();
        if (!fischerChallengeMol || !userRS || feedback || !fischerChallengeMol.chiralCenters?.length) return;

        const chiralIdx = fischerChallengeMol.chiralCenters[0]!;
        const targetRS = fischerChallengeMol.rsConfiguration?.[chiralIdx];
        const isCorrect = userRS === targetRS;
        const maxRounds = mode === "identifier" ? MAX_ROUNDS_IDENTIFIER : MAX_ROUNDS_FISCHER;

        if (isCorrect) {
            set((s) => ({ feedback: "correct", score: s.score + 20 }));
            setTimeout(() => {
                const { round: currentRound } = get();
                if (currentRound >= maxRounds) {
                    set({ gameOver: true });
                } else {
                    set({ round: currentRound + 1, feedback: null, userRS: null });
                    generateFischerChallenge();
                }
            }, 1000);
        } else {
            set({ feedback: "wrong" });
        }
    },

    nextRound: () => {
        const { mode, generateQuestion, generateFischerChallenge } = get();
        set({ feedback: null });
        if (mode === "identifier") {
            generateQuestion();
        } else {
            generateFischerChallenge();
        }
    },

    advanceRound: () => {
        const { round, mode, nextRound } = get();
        const maxRounds = mode === "identifier" ? MAX_ROUNDS_IDENTIFIER : MAX_ROUNDS_FISCHER;
        if (round >= maxRounds) {
            set({ gameOver: true });
        } else {
            set({ round: round + 1 });
            nextRound();
        }
    },
}));
