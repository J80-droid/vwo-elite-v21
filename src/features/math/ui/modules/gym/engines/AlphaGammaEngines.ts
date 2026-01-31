import { createInfiniteEngine } from "./AIGymAdapter";

// --- ECONOMICS ---
export const EconomicsMixEngine = createInfiniteEngine(
    "mix-economics",
    "Global Markets",
    "Economics VWO",
    "Focus op: Marktwerking (vraag/aanbod), Micro-economie (elasticiteit, speltheorie), Macro-economie (monetair beleid, inflatie) en Internationale Handel.",
    [
        {
            id: "eco-start-1",
            question: "Wat gebeurt er met de prijs bij een overschot op de markt?",
            answer: "prijs daalt",
            context: "Marktwerking",
            explanation: "Bij een overschot is het aanbod groter dan de vraag. Producenten zullen hun prijzen verlagen om van hun voorraad af te komen."
        },
        {
            id: "eco-start-2",
            question: "Is de vraag naar medicijnen doorgaans prijselastisch of prijsinelastisch?",
            answer: "prijsinelastisch",
            context: "Elasticiteit",
            explanation: "Medicijnen zijn vaak noodzakelijk. Zelfs bij een prijsstijging zal de gevraagde hoeveelheid nauwelijks afnemen."
        }
    ]
);

// --- HISTORY ---
export const HistoryMixEngine = createInfiniteEngine(
    "infinite-history",
    "Chronos AI",
    "History VWO",
    "Focus op de 10 tijdvakken, kenmerkende aspecten en historische contexten (Koude Oorlog, Verlichting, Wereldoorlogen).",
    [
        {
            id: "hist-start-1",
            question: "In welk jaar begon de Franse Revolutie?",
            answer: "1789",
            context: "Tijd van Burgers en Stoommachines",
            explanation: "1789 markeert de bestorming van de Bastille en het begin van de revolutie tegen het Ancien Régime."
        }
    ]
);

// --- GEOGRAPHY ---
export const GeographyMixEngine = createInfiniteEngine(
    "infinite-geography",
    "Global Navigator",
    "Geography VWO",
    "Focus op: Gebieden (Brazilië/Zuidoost-Azië), Systeem Aarde (klimaat, endogene/exogene krachten) en Wereld (globalisering, verstedelijking).",
    [
        {
            id: "geo-start-1",
            question: "Hoe noem je de cirkelvormige stroming van magma in de aardmantel?",
            answer: "convectiestromen",
            context: "Systeem Aarde",
            explanation: "Convectiestromen in de mantellaag zorgen voor het bewegen van de tektonische platen."
        }
    ]
);

// --- STATISTICS (MATH A) ---
export const StatisticsEngine = createInfiniteEngine(
    "stats-mastery",
    "Data Detective",
    "Statistics & Probability VWO",
    "Focus op: Kansberekening, Normale verdeling, Binomiale verdeling, Hypothese toetsen en Correlatie.",
    [
        {
            id: "stats-start-1",
            question: "Wat is de z-score van een waarde die precies op het gemiddelde ligt?",
            answer: "0",
            context: "Normale Verdeling",
            explanation: "De z-score geeft aan hoeveel standaardafwijkingen een waarde van het gemiddelde afwijkt. Op het gemiddelde is de afwijking nul."
        }
    ]
);
