import { createInfiniteEngine } from "../../../../math/ui/modules/gym/engines/AIGymAdapter";

const FRENCH_BACKUP = [
    {
        id: "fr-start-1",
        question: "Vertaal: 'Onmiskenbaar'.",
        answer: "indéniable",
        context: "Vocabulaire",
        alternatives: ["incontestable"]
    },
    {
        id: "fr-start-2",
        question: "Vervoeg **'aller'** in de *Futur Simple* (je).",
        answer: "irai",
        context: "Grammaire - Conjugaison"
    }
];

export const InfiniteFrenchEngine = createInfiniteEngine(
    "infinite-french",
    "Sorbonne AI",
    "Frans VWO",
    "Focus op: Cito-idioom, Subjonctif vs Indicatif, Tekststructuur en Logische verbanden.",
    FRENCH_BACKUP
);
