import { createInfiniteEngine } from "../../../../math/ui/modules/gym/engines/AIGymAdapter";

const EXPERIMENTS = [
    {
        id: "phil-trolley",
        name: "The Trolley Problem",
        scenario: "Een tram dendert op 5 mensen af. Jij kunt een hendel overhalen waardoor hij naar een ander spoor gaat waar maar 1 persoon staat.",
        question: "Wat zou een **Utilitarist** (gevolgenethiek) doen?",
        answer: "hendel overhalen",
        explanation: "Het utilitarisme kiest voor het grootste geluk voor de grootste groep (5 redden > 1 slachtoffer).",
        alternatives: ["overhalen", "trekken", "wisselen"]
    },
    {
        id: "phil-exp-machine",
        name: "The Experience Machine",
        scenario: "Je kunt in een machine stappen die je een perfect gelukkig leven simuleert. Je weet niet dat het nep is. Stap je in?",
        question: "Wat zou een **Hedonist** doen?",
        answer: "instappen",
        explanation: "Voor een hedonist is genot/geluk het hoogste goed, ongeacht of het 'echt' is.",
        alternatives: ["ja", "doen"]
    },
    {
        id: "phil-chinese-room",
        name: "The Chinese Room",
        scenario: "Iemand in een kamer volgt regels om Chinese tekens te ordenen zonder ze te begrijpen. Voor buitenstaanders lijkt het alsof hij Chinees spreekt.",
        question: "Wat is de conclusie van **Searle** over AI (computers)?",
        answer: "geen bewustzijn",
        explanation: "Computers (AI) manipuleren symbolen (syntax) zonder betekenis (semantiek) te begrijpen. Dus sterke AI is onmogelijk.",
        alternatives: ["geen begrip", "syntaxis is geen semantiek"]
    },
    {
        id: "phil-brain-vat",
        name: "Brain in a Vat",
        scenario: "Een kwade wetenschapper heeft je brein in een vat met vloeistof gestopt en stimuleert het met elektroden zodat je denkt dat je dit leest.",
        question: "Welke stroming stelt dat je niet kunt bewijzen dat dit NIET zo is?",
        answer: "scepticisme",
        explanation: "Sceptici stellen dat we geen zekere kennis over de buitenwereld kunnen hebben."
    },
    {
        id: "phil-panopticum",
        name: "Panopticum",
        scenario: "Gevangenen zitten in een cirkel rondom een wachttoren. Ze kunnen de bewaker niet zien, maar hij hen wel.",
        question: "Wat is volgens **Foucault** het effect op de gevangenen?",
        answer: "disciplinering",
        explanation: "De gevangenen internaliseren de blik van de bewaker en gaan zichzelf controleren (normalisering)."
    }
];

// Convert to GymProblems for the startup set
const STARTUP_SET = EXPERIMENTS.map(e => ({
    id: e.id,
    question: `**Scenario:** ${e.scenario}\n\n**Vraag:** ${e.question}`,
    answer: e.answer,
    context: e.name,
    alternatives: e.alternatives,
    solutionSteps: [`Experiment: ${e.name}`, e.explanation]
}));

export const ThoughtExperimentEngine = createInfiniteEngine(
    "thought-experiment",
    "De Denktank",
    "Filosofie Gedachte-experimenten",
    "Klassieke experimenten uit de filosofiegeschiedenis",
    STARTUP_SET
);
