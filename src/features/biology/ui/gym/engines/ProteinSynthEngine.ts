import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomChar = (str: string) => str[rand(0, str.length - 1)]!;

const CODON_TABLE: Record<string, string> = {
    AUG: "Met",
    UUU: "Phe",
    UUC: "Phe",
    UUA: "Leu",
    UUG: "Leu",
    UCU: "Ser",
    UCC: "Ser",
    UCA: "Ser",
    UCG: "Ser",
    UAU: "Tyr",
    UAC: "Tyr",
    UGU: "Cys",
    UGC: "Cys",
    UGG: "Trp",
    CCU: "Pro",
    CCC: "Pro",
    CCA: "Pro",
    CCG: "Pro",
    CAU: "His",
    CAC: "His",
    CAA: "Gln",
    CAG: "Gln",
    CGU: "Arg",
    CGC: "Arg",
    CGA: "Arg",
    CGG: "Arg",
    AUU: "Ile",
    AUC: "Ile",
    AUA: "Ile",
    ACU: "Thr",
    ACC: "Thr",
    ACA: "Thr",
    ACG: "Thr",
    AAU: "Asn",
    AAC: "Asn",
    AAA: "Lys",
    AAG: "Lys",
    AGU: "Ser",
    AGC: "Ser",
    AGA: "Arg",
    AGG: "Arg",
    GUU: "Val",
    GUC: "Val",
    GUA: "Val",
    GUG: "Val",
    GCU: "Ala",
    GCC: "Ala",
    GCA: "Ala",
    GCG: "Ala",
    GAU: "Asp",
    GAC: "Asp",
    GAA: "Glu",
    GAG: "Glu",
    GGU: "Gly",
    GGC: "Gly",
    GGA: "Gly",
    GGG: "Gly",
    UAA: "STOP",
    UAG: "STOP",
    UGA: "STOP",
};

const DNA_TO_RNA: Record<string, string> = { A: "U", T: "A", C: "G", G: "C" };

// Helper: Genereer een mini spiekbriefje voor in de UI
const getCodonCheatSheet = () => `
| Codon | AZ | | Codon | AZ |
|---|---|---|---|---|
| UUU/C | Phe | | UCU/C/A/G | Ser |
| UUA/G | Leu | | UAU/C | Tyr |
| AUG | **Met** | | UAA/G/GA | **STOP** |
| GUU/C/A/G | Val | | ACU/C/A/G | Thr |
| CCU/C/A/G | Pro | | GCU/C/A/G | Ala |
`;

export const ProteinSynthEngine: GymEngine = {
    id: "protein-synth",
    name: "Eiwit Codekraker",
    description: "Transcriptie, translatie en mutaties. Beheers het centrale dogma.",

    generate: (level: Difficulty): GymProblem | Promise<GymProblem> => {
        const timestamp = Date.now();

        switch (level) {
            case 1: {
                // DNA (Template 3'-5') -> mRNA (5'-3')
                // FIX: Label veranderd naar 3'-5' zodat directe vertaling klopt met leesrichting
                const dna = Array.from({ length: 9 }, () => getRandomChar("ATCG")).join("");
                const rna = dna
                    .split("")
                    .map((b) => DNA_TO_RNA[b])
                    .join("");
                return {
                    id: `ps-1-${timestamp}`,
                    question: `DNA (matrijsstreng): **3'-${dna}-5'**`,
                    answer: rna,
                    context: "Wat is de mRNA volgorde (5'->3')?",
                    solutionSteps: [
                        "De matrijsstreng (3'->5') wordt complementair afgelezen.",
                        "A->U, T->A, C->G, G->C.",
                        `3'-${dna}-5' wordt 5'-${rna}-3'.`,
                    ].map(s => s.includes("'") || s.includes("->") ? `$${s}$` : s),
                };
            }

            case 2: {
                // mRNA -> Aminozuur
                const codons = Object.keys(CODON_TABLE).filter((c) => CODON_TABLE[c] !== "STOP");
                const codon = codons[rand(0, codons.length - 1)]!;
                const amino = CODON_TABLE[codon]!;
                return {
                    id: `ps-2-${timestamp}`,
                    question: `Vertaal dit mRNA codon: **5'-${codon}-3'**`,
                    answer: amino,
                    context: `Gebruik Binas 71 (3-letter code).\n\n**Codon Tabel:**\n${getCodonCheatSheet()}`,
                    solutionSteps: [`Zoek ${codon} in de tabel.`, `Het codeert voor ${amino}.`],
                };
            }

            case 3: {
                // Mutaties (Dynamisch!)
                // 1. Kies random start codon (geen STOP)
                const codons = Object.keys(CODON_TABLE).filter((c) => CODON_TABLE[c] !== "STOP");
                const originalCodon = codons[rand(0, codons.length - 1)]!;
                const originalAmino = CODON_TABLE[originalCodon];

                // 2. Muteer 1 base
                let mutatedCodon = originalCodon;
                while (mutatedCodon === originalCodon) {
                    const pos = rand(0, 2);
                    const bases = ["U", "C", "A", "G"];
                    const chars = mutatedCodon.split("");
                    chars[pos] = bases[rand(0, 3)]!;
                    mutatedCodon = chars.join("");
                }

                const newAmino = CODON_TABLE[mutatedCodon];

                // 3. Bepaal type
                let type = "";
                let explanation = "";
                if (newAmino === "STOP") {
                    type = "nonsense";
                    explanation = "Er ontstaat een STOP-codon, dus: Nonsense.";
                } else if (newAmino === originalAmino) {
                    type = "silent";
                    explanation = "Het aminozuur verandert niet, dus: Silent.";
                } else {
                    type = "missense";
                    explanation = "Het aminozuur verandert, dus: Missense.";
                }

                return {
                    id: `ps-3-${timestamp}`,
                    question: `Puntmutatie: **${originalCodon}** (${originalAmino}) $\\to$ **${mutatedCodon}** (${newAmino || "STOP"
                        }).\n\nWelk type mutatie is dit?`,
                    answer: type,
                    context: `Kies uit: silent, missense, nonsense.\n\n**Codon Tabel:**\n${getCodonCheatSheet()}`,
                    solutionSteps: [
                        `Oud: ${originalCodon} = ${originalAmino}`,
                        `Nieuw: ${mutatedCodon} = ${newAmino}`,
                        explanation,
                    ],
                };
            }

            case 4: {
                // Coderende streng (5'-3') -> mRNA (5'-3')
                // Identiek behalve T->U
                const codingDna = Array.from({ length: 12 }, () => getRandomChar("ATCG")).join("");
                const mrna = codingDna.replace(/T/g, "U");
                return {
                    id: `ps-4-${timestamp}`,
                    question: `DNA (coderende streng): **5'-${codingDna}-3'**`,
                    answer: mrna,
                    context: "Transcribeer naar mRNA",
                    solutionSteps: [
                        "De coderende streng (non-template) is gelijk aan het mRNA.",
                        "Vervang alleen Thymine (T) door Uracil (U).",
                        `${codingDna} $\\to$ ${mrna}`,
                    ],
                };
            }

            default:
                return ProteinSynthEngine.generate(1);
        }
    },

    validate: (input: string, problem: GymProblem) => {
        const clean = input.trim().toLowerCase().replace(/\s/g, "");
        const correct = problem.answer.toLowerCase();

        // Check voor mutatie types
        if (["silent", "missense", "nonsense"].includes(correct)) {
            if (clean === correct) return { correct: true };
            return {
                correct: false,
                feedback: `Fout. Het juiste type was: ${problem.answer}`,
            };
        }

        // Check voor sequenties
        if (clean === correct) return { correct: true };

        return {
            correct: false,
            feedback: `Helaas. Het juiste antwoord was ${problem.answer}.`,
        };
    },
};
