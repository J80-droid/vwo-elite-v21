import { STATIC_QUESTIONS, StaticQuestion } from "../engines/StaticDataEngine";

const addQuestions = (key: string, level: number, questions: StaticQuestion[]) => {
    if (!STATIC_QUESTIONS[key]) STATIC_QUESTIONS[key] = {};
    STATIC_QUESTIONS[key][level] = questions;
};

// --- BONDING BUILDER (Bindingen) ---
addQuestions("bonding-builder", 1, [
    { id: "bb1", question: "Wat is de belangrijkste intermoleculaire binding bij **H2O**?", answer: "H-brug", context: "Micro-macro", acceptedAnswers: ["waterstofbrug", "h brug"], explanation: "Omdat de O-H binding sterk gepolariseerd is en O een negatieve deellading heeft en H een positieve, kunnen waterstofbruggen gevormd worden." },
    { id: "bb2", question: "Welk type binding zorgt voor het hoge smeltpunt van **NaCl**?", answer: "ionbinding", context: "Zouten", explanation: "NaCl is een zout bestaande uit $Na^+$ en $Cl^-$ ionen. De sterke elektrostatische aantrekking tussen deze ionen (ionbinding) vereist veel energie om te verbreken." },
    { id: "bb3", question: "Is hexaan (C6H14) hydrofiel of hydrofoob?", answer: "hydrofoob", context: "Oplosbaarheid", explanation: "Hexaan bevat alleen C-H bindingen die nagenoeg apolair zijn. Hierdoor kan het geen H-bruggen vormen met water en lost het niet op." },
    { id: "bb4", question: "Welke vanderwaalsbinding is sterker: in I2 (vast) of F2 (gas)?", answer: "I2", context: "Molecuulmassa effect", explanation: "I2 heeft een veel grotere molecuulmassa en meer elektronen dan F2, wat leidt tot sterkere tijdelijke dipolen en dus een sterkere vanderwaalsbinding." }
]);

// --- CARBON CODE (Koolstofchemie) ---
addQuestions("carbon-code", 1, [
    { id: "cc1", question: "Geef de systematische naam van: **CH3-COOH**", answer: "ethaanzuur", context: "Zuren", acceptedAnswers: ["azijnzuur"], explanation: "De langste keten heeft 2 C-atomen (ethaan) en de functionele groep is een carbonzuur (-COOH), dus ethaanzuur." },
    { id: "cc2", question: "Tot welke stofklasse behoort **CH3-COO-CH3**?", answer: "ester", context: "Functionele groepen", explanation: "De groep -COO- tussen twee koolstofketens is kenmerkend voor een ester." },
    { id: "cc3", question: "Hoe noemen we de groep -NH2?", answer: "amine", context: "Groepen", explanation: "Een stikstofatoom gebonden aan koolstofketens of waterstofatomen vormt een aminegroep." },
    { id: "cc4", question: "Wat is de naam van C3H6O (met dubbele binding op C2)?", answer: "propanon", context: "Ketonen", acceptedAnswers: ["aceton"], explanation: "Drie C-atomen (propaan) met een dubbelgebonden zuurstof op de middelste C maakt het een keton: propanon." }
]);

// --- EQUILIBRIUM EXPERT (Evenwichten) ---
addQuestions("equilibrium-expert", 1, [
    { id: "eq1", question: "Een reactie is exotherm. De temperatuur STIJGT. Waarheen verschuift het evenwicht?", answer: "links", context: "Le Chatelier (Temp)", explanation: "Volgens het principe van Le Chatelier probeert het systeem de temperatuurstijging tegen te gaan door energie te verbruiken. Dit gebeurt via de endotherme reactie (bij een exotherme heenreactie is dat de terugreactie naar links)." },
    { id: "eq2", question: "Bij het evenwicht $N_2 (g) + 3 H_2 (g) \\rightleftarrows 2 NH_3 (g)$ wordt de druk VERHOOGD. Waarheen verschuift het evenwicht?", answer: "rechts", context: "Le Chatelier (Druk)", explanation: "Een hogere druk dwingt het systeem naar de kant met het kleinste aantal gasdeeltjes. Links staan 4 deeltjes ($1+3$), rechts staan er maar 2. Het evenwicht schuift dus naar rechts." },
    { id: "eq3", question: "Je voegt een katalysator toe aan een evenwichtsmengsel. Wat gebeurt er met de ligging van het evenwicht?", answer: "niets", context: "Katalysator", acceptedAnswers: ["geen verandering", "blijft gelijk"], explanation: "Een katalysator versnelt zowel de heen- als de terugreactie in gelijke mate. Het evenwicht wordt sneller bereikt, maar de ligging (concentraties) verandert niet." }
]);

// --- POLYMER PUZZLE (Polymeren) ---
addQuestions("polymer-puzzle", 1, [
    { id: "pp1", question: "Wordt **PVC** gevormd via additie of condensatie?", answer: "additie", context: "Polymerisatie", explanation: "Polyvinylchloride (PVC) wordt gemaakt van vinylchloride (chlooretheen). Carbon-carbon dubbele bindingen klappen open om een keten te vormen zonder dat er bijproducten ontstaan." },
    { id: "pp2", question: "Welk klein molecuul splitst vaak af bij condensatiepolymerisatie?", answer: "water", context: "Afvalstof", acceptedAnswers: ["h2o"], explanation: "Bij de vorming van esters of amiden in condensatiereacties komt er per koppeling één watermolecuul vrij." },
    { id: "pp3", question: "Is een eiwit een additie- of condensatiepolymeer?", answer: "condensatie", context: "Biopolymeren", explanation: "Eiwitten zijn polymeren van aminozuren. Bij de vorming van de peptidebinding splitst water af, wat het een condensatiereactie maakt." },
    { id: "pp4", question: "Wat is het monomeer van polyetheen?", answer: "etheen", context: "Monomeren", explanation: "Polyetheen ontstaat door de additiepolymerisatie van etheenmoleculen ($C_2H_4$)." }
]);

// --- REDOX RELAY (Redox) ---
addQuestions("redox-relay", 1, [
    { id: "rr1", question: "Is **$F_2$** een sterke oxidator of reductor?", answer: "oxidator", context: "Binas 48", explanation: "Fluor staat helemaal bovenaan in de lijst met oxidatoren (Binas 48). Het heeft de hoogste elektronegativiteit en wil dus heel graag elektronen opnemen." },
    { id: "rr2", question: "Neemt een oxidator elektronen op of staat hij ze af?", answer: "op", context: "Ezelsbruggetje", acceptedAnswers: ["opnemen"], explanation: "**Oxidator** neemt elektronen **op**. (Ezelsbruggetje: Oxidat-OP)." },
    { id: "rr3", question: "Wat is de standaardelektrodepotentiaal van het koppel $Cu^{2+} / Cu$?", answer: "0,34", context: "Volt", acceptedAnswers: ["+0,34"], explanation: "Dit kun je opzoeken in Binas tabel 48: $Cu^{2+} + 2e^- \to Cu$ heeft een $V^0$ van $+0,34$ Volt." }
]);

// --- KINETICS (Reactiesnelheid & Energie) ---
addQuestions("kinetics-master", 1, [
    { id: "kin1", question: "Welke factor verlaagt de activeringsenergie van een reactie?", answer: "katalysator", context: "Energie diagram", explanation: "Een katalysator biedt een alternatieve route voor de reactie met een lagere drempelwaarde (activeringsenergie), waardoor de reactie sneller verloopt." },
    { id: "kin2", question: "Waarom verhoogt temperatuur de reactiesnelheid? (Denk aan deeltjes)", answer: "meer effectieve botsingen", context: "Botsende deeltjes", acceptedAnswers: ["snellere botsingen", "hardere botsingen", "meer botsingen"], explanation: "Bij een hogere temperatuur bewegen deeltjes sneller, waardoor ze vaker botsen én meer deeltjes genoeg energie hebben voor een effectieve botsing." },
    { id: "kin3", question: "Wat is de orde van de reactie als de snelheid verdubbelt bij verdubbeling van de concentratie?", answer: "eerste orde", context: "S = k[A]^n", explanation: "In de snelheidsvergelijking $s = k[A]^n$ geldt dat als $[A]$ keer 2 gaat en $s$ ook keer 2 gaat, de exponent $n$ gelijk moet zijn aan 1." }
]);

// --- ANALYSIS (Spectrometrie Puzzels) ---
addQuestions("analysis-detective", 1, [
    { id: "ana1", question: "Bij Massaspectrometrie: welk molecuulfragment (radicaal) hoort vaak bij m/z = 15?", answer: "methyl", context: "CH3+", acceptedAnswers: ["ch3", "methylgroep"], explanation: "Een methylgroep ($CH_3$) heeft een atoommassa van $12 (C) + 3 \times 1 (H) = 15$ u." },
    { id: "ana2", question: "Welke binding geeft een sterke, brede absorptie rond 3200-3600 cm-1 in een IR-spectrum?", answer: "O-H", context: "Infrarood", acceptedAnswers: ["oh groep", "alcohol", "hydroxyl"], explanation: "De O-H binding (vooral in alcoholen of zuren) vormt waterstofbruggen, wat leidt tot een heel kenmerkende brede dip in het IR-spectrum rond dit golfgetal." },
    { id: "ana3", question: "Welke binding geeft een scherpe absorptie rond 1700 cm-1 in een IR-spectrum?", answer: "C=O", context: "Carbonylgroep", acceptedAnswers: ["carbonyl", "c=o"], explanation: "De $C=O$ dubbele binding in aldehyden, ketonen, zuren of esters geeft altijd een zeer sterke en scherpe absorptie rond de $1700 cm^{-1}$." },
    { id: "ana4", question: "Welk element zorgt vaak voor een M+2 piek op gelijke hoogte als de M+ piek in massaspectrometrie?", answer: "broom", context: "Isotopen", acceptedAnswers: ["br"], explanation: "Broom komt in de natuur voor als een mengsel van ca. 50% $^{79}Br$ en 50% $^{81}Br$. Hierdoor zie je in het massaspectrum twee MS-pieken met een verschil van 2 massa-eenheden die bijna even hoog zijn." }
]);
