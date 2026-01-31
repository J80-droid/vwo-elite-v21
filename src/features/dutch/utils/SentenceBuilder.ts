
import { Difficulty } from "@shared/types/gym";

// --- LEXICON ---

const SUBJECTS = [
    { text: "De man", gender: "m", singular: true },
    { text: "De vrouw", gender: "f", singular: true },
    { text: "Het kind", gender: "n", singular: true },
    { text: "De honden", gender: "m", singular: false },
    { text: "De leraren", gender: "m", singular: false },
    { text: "Mijn buurman", gender: "m", singular: true },
    { text: "Onze kat", gender: "m", singular: true },
];

const VERBS_TRANSITIVE = [
    { inf: "zien", present: "ziet", past: "zag", pp: "gezien" },
    { inf: "roepen", present: "roept", past: "riep", pp: "geroepen" },
    { inf: "helpen", present: "helpt", past: "hielp", pp: "geholpen" },
    { inf: "zoeken", present: "zoekt", past: "zocht", pp: "gezocht" },
    { inf: "volgen", present: "volgt", past: "volgde", pp: "gevolgd" },
];

const VERBS_INTRANSITIVE = [
    { inf: "lopen", present: "loopt", past: "liep", pp: "gelopen" },
    { inf: "slapen", present: "slaapt", past: "sliep", pp: "geslapen" },
    { inf: "wachten", present: "wacht", past: "wachtte", pp: "gewacht" },
    { inf: "werken", present: "werkt", past: "werkte", pp: "gewerkt" },
];

const OBJECTS = [
    "de auto", "een boek", "het huis", "een brief", "de film", "het avondeten"
];

const ADVERBS_TIME = [
    "gisteren", "vandaag", "morgen", "soms", "vaak", "nooit", "ineens"
];

const ADVERBS_PLACE = [
    "in de tuin", "op straat", "bij school", "in het park", "thuis"
];

// --- BUILDER ---

export interface GeneratedSentence {
    text: string;
    pv: string; // Persoonsvorm
    ond: string; // Onderwerp
    structure: string;
}

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

export const generateDutchSentence = (difficulty: Difficulty): GeneratedSentence => {
    // Structure: [Subject] [PV] [Adverb/Object] ...

    const sub = pick(SUBJECTS);
    const useTransitive = Math.random() > 0.5;
    const verb = useTransitive ? pick(VERBS_TRANSITIVE) : pick(VERBS_INTRANSITIVE);

    // Tense: 50/50 Present/Past
    const isPast = Math.random() > 0.5;

    let pv = isPast ? verb.past : verb.present;
    // Plural check for verb
    if (!sub.singular) {
        if (isPast) {
            // Past Plural: liep -> liepen, werkte -> werkten
            // Simple heuristic for irregulars (often +en)
            if (verb.past.endsWith("te") || verb.past.endsWith("de")) pv = verb.past + "n";
            else pv = verb.past + "en";
        } else {
            pv = verb.inf;
        }
    }

    // Determine sentence parts
    const time = Math.random() > 0.7 ? pick(ADVERBS_TIME) : "";
    const place = Math.random() > 0.7 ? pick(ADVERBS_PLACE) : "";
    const object = useTransitive ? pick(OBJECTS) : "";

    // Assemble
    // Main clause order: Subject - PV - Time - Object - Place
    let parts = [sub.text, pv];
    if (time) parts.push(time);
    if (object) parts.push(object);
    if (place) parts.push(place);

    let text = parts.join(" ") + ".";

    // Level 2: Inversion (Time - PV - Subject ...)
    if (difficulty > 1 && time) {
        parts = [time, pv, sub.text.toLowerCase()]; // Note: Subject lowercase because not start
        if (object) parts.push(object);
        if (place) parts.push(place);
        text = parts.join(" ") + ".";
        // Capitalize first letter
        text = text.charAt(0).toUpperCase() + text.slice(1);
    }

    return {
        text,
        pv,
        ond: sub.text, // "De man" stays "De man" even if used as "de man" in inversion for checked answer key?
        // Ideally answer key matches text case or is robust. 
        // Let's keep distinct 'ond' for the answer key.
        structure: "Main Clause"
    };
};
