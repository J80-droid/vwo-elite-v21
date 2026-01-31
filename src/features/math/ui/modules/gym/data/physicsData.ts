import { STATIC_QUESTIONS, StaticQuestion } from "../engines/StaticDataEngine";

const addQuestions = (key: string, level: number, questions: StaticQuestion[]) => {
    if (!STATIC_QUESTIONS[key]) STATIC_QUESTIONS[key] = {};
    STATIC_QUESTIONS[key][level] = questions;
};

// --- GRAPH INTERPRETER (Grafieken lezen) ---
addQuestions("graph-interpreter", 1, [
    { id: "gr1", question: "Wat betekent de **oppervlakte** onder een $(v,t)$-diagram?", answer: "verplaatsing", context: "Integraal van snelheid", acceptedAnswers: ["afstand", "afgelegde weg"], explanation: "De integraal $\\int v \\cdot dt$ staat gelijk aan de verplaatsing $s$. De oppervlakte onder de grafiek vertegenwoordigt dus hoeveel meter er is afgelegd." },
    { id: "gr2", question: "Wat betekent de **helling** (raaklijn) in een $(x,t)$-diagram?", answer: "snelheid", context: "Afgeleide van plaats", explanation: "De snelheid $v$ is de verandering van plaats per tijdseenheid ($dx/dt$). In een grafiek komt dit overeen met de steilheid of helling." },
    { id: "gr3", question: "Wat betekent de **helling** in een $(v,t)$-diagram?", answer: "versnelling", context: "Afgeleide van snelheid", explanation: "De versnelling $a$ is de verandering van snelheid per tijdseenheid ($dv/dt$). De helling geeft aan hoe snel de snelheid toeneemt of afneemt." },
    { id: "gr4", question: "Wat betekent de **oppervlakte** onder een $(F,u)$-diagram (Kracht-uitwijking)?", answer: "arbeid", context: "Of veerenergie", explanation: "Arbeid $W$ is $\\int F \\cdot du$. In het geval van een veer is de oppervlakte onder de $(F,u)$-grafiek gelijk aan de opgeslagen veerenergie." }
]);

// --- PARTICLE ZOO (Standaardmodel) ---
addQuestions("particle-zoo", 1, [
    { id: "pz1", question: "Tot welke familie behoren het elektron en het neutrino?", answer: "leptonen", context: "Standaardmodel", explanation: "Leptonen zijn een familie van elementaire deeltjes. Er zijn 3 types: elektron, muon en tau, elk met een bijbehorend neutrino." },
    { id: "pz2", question: "Uit welke quarks bestaat een proton?", answer: "uud", context: "Up Up Down", acceptedAnswers: ["up up down"], explanation: "Een proton is een baryon bestaande uit twee *up* quarks (lading +2/3 elk) en één *down* quark (lading -1/3), wat een totale lading van +1 geeft." },
    { id: "pz3", question: "Welk krachtdeeltje (boson) hoort bij de elektromagnetische kracht?", answer: "foton", context: "Lichtdeeltje", explanation: "Fotonen zijn de dragers van de elektromagnetische wisselwerking. Ze hebben geen rustmassa en geen lading." },
    { id: "pz4", question: "Wat is het antideeltje van een elektron?", answer: "positron", context: "Antimaterie", explanation: "Het positron heeft dezelfde massa als een elektron, maar een tegengestelde positieve lading (+1)." }
]);

// --- ASTRO KNOWLEDGE (Heelal) ---
addQuestions("astro-knowledge", 1, [
    { id: "ak1", question: "Wat is de eenheid 'lichtjaar'?", answer: "afstand", context: "Geen tijd!", acceptedAnswers: ["lengte"], explanation: "Een lichtjaar is de afstand die licht in vacuüm aflegt in één jaar tijd, ongeveer $9,461 \\cdot 10^{15}$ meter." },
    { id: "ak2", question: "Hoe noemen we de waargenomen golflengteverandering bij bewegende sterren?", answer: "dopplereffect", context: "Roodverschuiving", explanation: "Als een ster van ons af beweegt, worden de lichtgolven uitgerekt (roodverschuiving). Naar ons toe worden ze korter (blauwverschuiving). Dit is het dopplereffect." },
    { id: "ak3", question: "Welke kracht zorgt voor het samenkrimpen van een gaswolk tot een ster?", answer: "zwaartekracht", context: "Gravitatie", explanation: "Zwaartekracht trekt de gasdeeltjes naar elkaar toe. Als de wolk compact genoeg wordt, stijgt de temperatuur totdat kernfusie begint." }
]);
