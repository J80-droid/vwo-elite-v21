import { ChemistryFormatter, createInfiniteEngine } from "../../../../math/ui/modules/gym/engines/AIGymAdapter";

const CHEM_BACKUP = [
    {
        id: "ch-start-1",
        question: "Geef de molecuulformule van **zwavelzuur**.",
        answer: "H_2SO_4",
        context: "Zuren & Basen",
        explanation: "Zwavelzuur is een sterk tweepercentage zuur met de formule $H_2SO_4$."
    },
    {
        id: "ch-start-2",
        question: "Wat is de systematische naam van CH3-COOH?",
        answer: "ethaanzuur",
        context: "Koolstofchemie",
        alternatives: ["azijnzuur"],
        explanation: "Het molecuul heeft 2 C-atomen (ethaan) en een zuurgroep (-COOH), dus ethaanzuur."
    },
    {
        id: "ch-start-3",
        question: "Is de reactie van een zuur met een base exotherm of endotherm?",
        answer: "exotherm",
        context: "Thermodynamica",
        explanation: "Bij een neutralisatiereactie komt altijd energie (warmte) vrij, dus de reactie is exotherm."
    }
];

export const InfiniteChemEngine = createInfiniteEngine(
    "infinite-chem",
    "Chem-Lab AI",
    "Scheikunde VWO",
    "Onderwerpen: Redox, Zuur-Base (pH), Koolstofchemie, Reactiekinetiek.",
    CHEM_BACKUP,
    ChemistryFormatter // Pluggen de formatter in voor automatisch subscript
);
