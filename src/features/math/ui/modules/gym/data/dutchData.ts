import { STATIC_QUESTIONS, StaticQuestion } from "../engines/StaticDataEngine";

const addQuestions = (key: string, level: number, questions: StaticQuestion[]) => {
    if (!STATIC_QUESTIONS[key]) STATIC_QUESTIONS[key] = {};
    STATIC_QUESTIONS[key][level] = questions;
};

// --- ARGUMENTATION (Drogredenen & Schema's) ---
addQuestions("argumentation-logic", 1, [
    { id: "arg1", question: "'Ik vind dat we niet moeten bezuinigen, want jij hebt zelf ook een dure auto.' Welke drogreden is dit?", answer: "persoonlijke aanval", context: "Op de man spelen", acceptedAnswers: ["ad hominem"], solutionSteps: ["De spreker valt de persoon aan in plaats van het argument te weerleggen (Ad Hominem)."] },
    { id: "arg2", question: "'Iedereen weet toch dat vrouwen slechter kunnen autorijden.' Welke drogreden?", answer: "ontduiken van bewijslast", context: "Doen alsof het feit is", solutionSteps: ["Door te zeggen 'iedereen weet toch', weigert de spreker bewijs te leveren voor de stelling."] },
    { id: "arg3", question: "'Als we softdrugs legaliseren, spuit straks iedereen heroïne.' Welke drogreden?", answer: "hellend vlak", context: "Van kwaad tot erger", acceptedAnswers: ["slippery slope"], solutionSteps: ["Er wordt onterecht voorspeld dat een maatregel onherroepelijk leidt tot extreme gevolgen."] }
]);
addQuestions("argumentation-logic", 2, [
    { id: "arg4", question: "Wat is het verzwegen argument in: 'Piet is een VWO-leerling, dus hij is intelligent.'?", answer: "alle vwo-leerlingen zijn intelligent", context: "Syllogisme", acceptedAnswers: ["vwo-leerlingen zijn intelligent"], solutionSteps: ["De verzwegen aanname is de algemene regel: Als je X bent, ben je Y (VWO -> Intelligent)."] },
    { id: "arg5", question: "'Omdat ik het zeg.' Welke drogreden?", answer: "autoriteitsargument", context: "Beroep op autoriteit (foutief)", solutionSteps: ["Er wordt geen inhoudelijk argument gegeven, alleen verwezen naar de positie van de spreker."] }
]);

// --- TEXT ANATOMY (Tekststructuren & Signaalwoorden) ---
addQuestions("text-anatomy", 1, [
    { id: "txt1", question: "Welk tekstverband wordt aangegeven met signaalwoorden als: 'kortom', 'al met al'?", answer: "concluderend", context: "Slot van een tekst", explanation: "Deze woorden leiden een samenvatting of conclusie in van hetgeen daarvoor besproken is." },
    { id: "txt2", question: "Welk verband hoort bij: 'tenzij', 'mits', 'indien'?", answer: "voorwaardelijk", context: "Afhankelijkheid", explanation: "Deze woorden geven een **voorwaarde** aan. Iets gebeurt *alleen als* (mits/indien) of *behalve als* (tenzij) aan een conditie wordt voldaan." },
    { id: "txt3", question: "Is een uiteenzetting bedoeld om te overtuigen, te informeren of te activeren?", answer: "informeren", context: "Tekstdoelen", explanation: "Een uiteenzetting is een objectieve tekst die uitleg geeft over een onderwerp, zonder dat de auteur probeert de lezer te overtuigen of aan te zetten tot actie." }
]);

// --- STYLE POLISH (Stijlfouten) ---
addQuestions("style-polish", 1, [
    { id: "sty1", question: "Wat is de stijlfout in: 'De witte sneeuw'?", answer: "pleonasme", context: "Dubbelop (eigenschap zit al in woord)", solutionSteps: ["Sneeuw is altijd wit. Het bijvoeglijk naamwoord herhaalt een eigenschap die al in het zelfstandig naamwoord zit."] },
    { id: "sty2", question: "Wat is de stijlfout in: 'Hij wil dat nachecken'?", answer: "contaminatie", context: "Nakijken + checken", solutionSteps: ["Dit is een verhaspeling van 'nakijken' en 'checken'."] },
    { id: "sty3", question: "Wat is de stijlfout in: 'Een aantal mensen gingen naar huis'?", answer: "incongruentie", context: "Onderwerp enkelvoud, persoonsvorm meervoud", solutionSteps: ["'Een aantal' is grammaticaal enkelvoud, dus de persoonsvorm moet ook enkelvoud zijn (ging)."] }
]);

// --- LITERATURE (Literatuurgeschiedenis & Begrippen) ---
addQuestions("literature-quiz", 1, [
    { id: "lit1", question: "In welke stroming staat het gevoel en de verbeelding centraal (ca. 1800-1850)?", answer: "romantiek", context: "Tegenreactie op verlichting", solutionSteps: ["De Romantiek was een reactie op het rationalisme van de Verlichting. Gevoel, natuur en verbeelding stonden centraal."] },
    { id: "lit2", question: "Wie schreef 'Max Havelaar'?", answer: "multatuli", context: "Eduard Douwes Dekker", solutionSteps: ["Multatuli is het pseudoniem van Eduard Douwes Dekker."] },
    { id: "lit3", question: "Hoe noemen we een gedicht van 14 regels met een wending (volta)?", answer: "sonnet", context: "Dichtvormen", solutionSteps: ["Een sonnet bestaat uit twee kwatrijnen (octaaf) en twee terzinen (sextet), met een wending daartussen."] }
]);
addQuestions("literature-quiz", 2, [
    { id: "lit4", question: "Bij welk perspectief weet de verteller alles van alle personages?", answer: "auctoriaal", context: "Alwetende verteller", solutionSteps: ["De auctoriale verteller staat boven het verhaal en heeft toegang tot de gedachten van alle personages."] },
    { id: "lit5", question: "Wat is het thema van 'De Aanslag' van Harry Mulisch?", answer: "schuld", context: "Of: toeval / WO2", acceptedAnswers: ["oorlog", "toeval"], solutionSteps: ["Het thema schuld (en onschuld) en de invloed van het toeval op het lot staan centraal."] }
]);

// --- VOCABULARY EXPERT (Moeilijke woorden) ---
addQuestions("vocab-expert", 1, [
    { id: "voc1", question: "Wat betekent **bagatelliseren**?", answer: "onbelangrijk maken", context: "Iets als een kleinigheid voorstellen", acceptedAnswers: ["kleiner maken", "minimaliseren"], solutionSteps: ["Bagatelliseren komt van 'bagatel' (kleinigheid)."] },
    { id: "voc2", question: "Wat is een **discrepantie**?", answer: "verschil", context: "Tussen theorie en praktijk", acceptedAnswers: ["tegenstrijdigheid", "afwijking"], solutionSteps: ["Een discrepantie duidt op een situatie waarin twee dingen niet met elkaar overeenkomen (bijv. woorden en daden)."] },
    { id: "voc3", question: "Wat betekent **autonoom**?", answer: "zelfstandig", context: "Onafhankelijk beslissen", acceptedAnswers: ["onafhankelijk", "zelfbeschikkend"], solutionSteps: ["Auto (zelf) + nomos (wet) = zichzelf de wet voorschrijvend."] },
    { id: "voc4", question: "Wat betekent **nuanceren**?", answer: "afzwakken", context: "Kleine verschillen aanbrengen", acceptedAnswers: ["verduidelijken", "preciseren"], solutionSteps: ["Nuanceren betekent kanttekeningen plaatsen of details aanbrengen, zodat een beeld minder zwart-wit is."] }
]);
addQuestions("vocab-expert", 2, [
    { id: "voc5", question: "Wat is **consensus**?", answer: "overeenstemming", context: "Iedereen is het eens", solutionSteps: ["Consensus is bereikt wanneer de leden van een groep overeenstemming hebben bereikt."] },
    { id: "voc6", question: "Wat betekent **triviaal**?", answer: "alledaags", context: "Onbeduidend / Gewoon", acceptedAnswers: ["onbalonrijk", "banaal"], solutionSteps: ["Iets is triviaal als het onbelangrijk, alledaags of vanzelfsprekend is."] },
    { id: "voc7", question: "Wat betekent **sceptisch**?", answer: "twijfelend", context: "Kritisch", acceptedAnswers: ["argwanend"], solutionSteps: ["Iemand die sceptisch is, neemt niet zomaar iets aan maar twijfelt aan de waarheid ervan."] }
]);
