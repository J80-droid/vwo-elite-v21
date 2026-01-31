import { STATIC_QUESTIONS, StaticQuestion } from "../engines/StaticDataEngine";

const addQuestions = (key: string, level: number, questions: StaticQuestion[]) => {
    if (!STATIC_QUESTIONS[key]) STATIC_QUESTIONS[key] = {};
    STATIC_QUESTIONS[key][level] = questions;
};

// --- ANTHRO IDENTITY (Lichaam & Geest) ---
addQuestions("anthro-identity", 1, [
    { id: "ai1", question: "Welke filosoof stelde dat de mens bestaat uit **res extensa** en **res cogitans**?", answer: "descartes", context: "Dualisme", acceptedAnswers: ["rené descartes"], explanation: "Descartes is de vader van het substantiedualisme. *Res cogitans* is het denkende (onstoffelijke) en *res extensa* is het uitgebreide (stoffelijke/lichaam)." },
    { id: "ai2", question: "Wat is het **monisme** volgens Spinoza?", answer: "eenheid", context: "Lichaam en geest zijn één substantie", acceptedAnswers: ["alles is een"], explanation: "Spinoza stelt dat er maar één substantie is (God of de Natuur). Geest en lichaam zijn slechts twee verschillende 'attributen' van diezelfde eenheid." },
    { id: "ai3", question: "Wie stelt dat het 'ik' slechts een **bundel van ervaringen** is?", answer: "hume", context: "Empirisme", explanation: "Hume concludeert dat als we naar binnen kijken, we nooit een 'kern-ik' vinden, alleen een voortdurende stroom van losse percepties en ervaringen." },
    { id: "ai4", question: "Wat betekent **determinisme** voor de vrije wil?", answer: "illusie", context: "Alles ligt vast", explanation: "Als elke gebeurtenis volledig wordt bepaald door voorafgaande oorzaken (natuurwetten), dan is de keuzevrijheid volgens deterministen schijn." }
]);

// --- ETHICS CLASH (Ethiek) ---
addQuestions("ethics-clash", 1, [
    { id: "ec1", question: "Welk principe staat centraal bij het **Utilitarisme**?", answer: "grootste geluk", context: "Gevolgenethiek", acceptedAnswers: ["nut", "utiliteit"], explanation: "Het utilitarisme (Bentham/Mill) stelt dat een handeling moreel juist is als deze resulteert in het grootste geluk voor het grootste aantal mensen." },
    { id: "ec2", question: "Hoe heet de universele wet van Kant?", answer: "categorisch imperatief", context: "Plichtethiek", explanation: "Kant stelt: 'Handel alleen volgens die regel waarvan je zou willen dat het een algemene wet wordt'. Het is een dwingende (categorische) plicht." },
    { id: "ec3", question: "Waar zoekt de **deugdethiek** naar?", answer: "het juiste midden", context: "Aristoteles", acceptedAnswers: ["gulden middenweg"], explanation: "Aristoteles stelt dat een deugd altijd het midden is tussen twee uitersten (bijv. moed ligt tussen lafheid en overmoed)." }
]);

// --- TECH MEDIATION (Mens & Techniek) ---
addQuestions("tech-mediation", 1, [
    { id: "tm1", question: "Wat betekent **technologische bemiddeling**?", answer: "vormgeven", context: "Techniek stuurt waarneming en gedrag", explanation: "Techniek is niet neutraal; het geeft vorm aan hoe wij de wereld waarnemen (bijv. een bril) en hoe we erin handelen (bijv. de pil)." },
    { id: "tm2", question: "What is **multistabiliteit**?", answer: "meerdere betekenissen", context: "Context-afhankelijkheid", explanation: "Een technologie kan in verschillende contexten verschillende functies of betekenissen hebben (bijv. een mobiel als telefoon of als spionagemiddel)." },
    { id: "tm3", question: "Wat betekent **scripting** in technologie?", answer: "gedragssturing", context: "Drempels sturen gedrag", acceptedAnswers: ["sturing", "voorschrijven"], explanation: "Productiebeslissingen 'schrijven voor' hoe een gebruiker zich moet gedragen (bijv. een autogordel die piept dwingt je hem om te doen)." }
]);

// --- KNOWLEDGE LAB (Kennisleer) ---
addQuestions("knowledge-lab", 1, [
    { id: "kl1", question: "Wie zei: 'Ik denk, dus ik ben'?", answer: "descartes", context: "Cogito ergo sum", explanation: "Door aan alles te twijfelen, ontdekte Descartes dat het feit dat hij twijfelde (dacht) bewees dat hij bestond als denkend wezen." },
    { id: "kl2", question: "Wat is **falsificatie** (Popper)?", answer: "weerlegbaarheid", context: "Wetenschap moet weerlegbaar zijn", explanation: "Volgens Popper is een theorie pas wetenschappelijk als je kunt aangeven onder welke omstandigheden de theorie onjuist (vals) zou zijn." },
    { id: "kl3", question: "Wat is een **paradigma** (Kuhn)?", answer: "denkkader", context: "Wetenschappelijk wereldbeeld", explanation: "Een paradigma is het geheel van overtuigingen en methoden dat de wetenschap in een bepaalde periode domineert tot er een 'revolutie' plaatsvindt." }
]);

// --- PRIMARY TEXT (Jargon) ---
addQuestions("primary-text", 1, [
    { id: "pt1", question: "Wat betekent **Dasein** (Heidegger)?", answer: "er zijn", context: "Het menselijk bestaan", acceptedAnswers: ["menselijk bestaan"], explanation: "Dasein is de term voor het wezen (de mens) dat zich bewust is van zijn eigen bestaan en 'geworpen' is in de wereld." },
    { id: "pt2", question: "Wat is de **Wil tot Macht** (Nietzsche)?", answer: "zelfoverwinning", context: "Drang tot groei", explanation: "Het is niet alleen macht over anderen, maar vooral de drang van het leven om zichzelf te overtreffen en te groeien in kracht." }
]);

// --- EXAMEN 2025: MENS & TECHNIEK ---
addQuestions("tech-exam-2025", 1, [
    { id: "ex1", question: "Wat betekent **excentriciteit** volgens Plessner?", answer: "afstand kunnen nemen", context: "De mens kan naar zichzelf kijken", acceptedAnswers: ["buiten jezelf treden", "reflexiviteit"], explanation: "De mens is zich ervan bewust dat hij een lichaam *is* maar ook een lichaam *heeft*. Hij kan 'buiten' zijn centrum treden om zichzelf te observeren." },
    { id: "ex2", question: "Wat is volgens Plessner het verschil tussen mens en dier?", answer: "excentrische positie", context: "Dier is centrisch, mens is excentrische", explanation: "Een dier *is* zijn lichaam (centrisch), terwijl een mens afstand kan nemen van zijn fysieke bestaan (excentrisch)." },
    { id: "ex3", question: "Wat bedoelt Foucault met **biopolitiek**?", answer: "controle over het leven", context: "Macht over lichamen en populaties", explanation: "Moderne macht richt zich op het beheren van het leven (gezondheid, geboortecijfers, hygiëne) in plaats van alleen op het bestraffen van misdaad." },
    { id: "ex4", question: "Wat is het **Panopticum**?", answer: "gevangenis", context: "Model voor disciplinering (Bentham/Foucault)", explanation: "Een ronde gevangenis waarbij gevangenen denken dat ze altijd bekeken kúnnen worden, waardoor ze hun eigen gedrag gaan controleren." }
]);

// --- OOSTERSE FILOSOFIE (Wereldfilosofie) ---
addQuestions("eastern-phil", 1, [
    { id: "east1", question: "Wat betekent **Tao**?", answer: "de weg", context: "Taoïsme", acceptedAnswers: ["het pad", "de loop der dingen"], explanation: "De Tao is de bron van alles en de natuurlijke weg of balans van het universum waar je als mens naar moet streven." },
    { id: "east2", question: "Wat is **Wu Wei**?", answer: "niet-handelen", context: "Handelen zonder dwang / Met de stroom mee", acceptedAnswers: ["doen door niet te doen"], explanation: "Het betekent niet dat je niets doet, maar dat je meebeweegt met de natuurlijke loop der dingen zonder weerstand of dwang." },
    { id: "east3", question: "Wat is het doel van het Boeddhisme (Nirvana)?", answer: "verlichting", context: "Opheffen van lijden", explanation: "Door het loslaten van begeerte en het ik-besef stopt het lijden en bereikt men een staat van bevrijding (Nirvana)." }
]);
