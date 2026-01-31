import { STATIC_QUESTIONS, StaticQuestion } from "../engines/StaticDataEngine";

const addQuestions = (key: string, level: number, questions: StaticQuestion[]) => {
    if (!STATIC_QUESTIONS[key]) STATIC_QUESTIONS[key] = {};
    STATIC_QUESTIONS[key][level] = questions;
};

// --- VOCAB CITO (Signaalwoorden & Examenidioom) ---
addQuestions("vocab-cito", 1, [
    { id: "vc1", question: "Wat betekent **toutefois**?", answer: "echter", context: "Tegenstelling", acceptedAnswers: ["evenwel"], explanation: "**Toutefois** is een formeel signaalwoord dat een tegenstelling of beperking aangeeft (echter/evenwel)." },
    { id: "vc2", question: "Wat betekent **néanmoins**?", answer: "niettemin", context: "Tegenstelling", acceptedAnswers: ["desalniettemin"], explanation: "**Néanmoins** wordt gebruikt om een tegenstelling te introduceren, vergelijkbaar met 'niettemin'." },
    { id: "vc3", question: "Wat betekent **susciter** (bijv. de l'interesse)?", answer: "opwekken", context: "Veroorzaken", acceptedAnswers: ["veroorzaken", "teweegbrengen"], explanation: "Susciter betekent het veroorzaken of teweegbrengen van een gevoel of reactie (bijv. interesse opwekken)." },
    { id: "vc4", question: "Wat betekent **préconiser**?", answer: "aanbevelen", context: "Raadgeven", acceptedAnswers: ["aanraden", "pleiten voor"], explanation: "Préconiser betekent het publiekelijk aanbevelen van een bepaalde methode of oplossing." },
    { id: "vc5", question: "Wat betekent **redoutable**?", answer: "geducht", context: "Om bang voor te zijn", acceptedAnswers: ["gevreesd"], explanation: "Iets of iemand die 'redoutable' is, boezemt angst of ontzag in (geducht/gevreesd)." }
]);

// --- CONNECTOR CODE (Verbanden) ---
addQuestions("connector-code", 1, [
    { id: "cc1", question: "Welk verband geeft **en revanche** aan?", answer: "tegenstelling", context: "Daarentegen", explanation: "**En revanche** wordt gebruikt om een positief aspect tegenover iets negatiefs te zetten (daarentegen)." },
    { id: "cc2", question: "Welk verband geeft **par conséquent** aan?", answer: "gevolg", context: "Dus/Daardoor", explanation: "**Par conséquent** leidt een logisch gevolg in van wat daarvoor is gezegd (dus/gevolgbaar)." },
    { id: "cc3", question: "Welk verband geeft **d'ailleurs** aan?", answer: "toevoeging", context: "Trouwens/Overigens", explanation: "**D'ailleurs** wordt gebruikt om een extra argument of informatie toe te voegen (trouwens/overigens)." },
    { id: "cc4", question: "Welk verband geeft **puisque** aan?", answer: "oorzaak", context: "Aangezien/Immers", explanation: "**Puisque** geeft een reden aan die vaak al bekend wordt verondersteld (aangezien/immers)." }
]);

// --- FALSE FRIENDS (Instinkers) ---
addQuestions("false-friends", 1, [
    { id: "ff1", question: "Betekent **travailler**: reizen of werken?", answer: "werken", context: "Travel = voyager", explanation: "**Travailler** betekent werken. Het woord voor reizen is *voyager*." },
    { id: "ff2", question: "Betekent **user**: gebruiken of verslijten?", answer: "verslijten", context: "Use = utiliser", explanation: "**User** betekent verslijten (denk aan 'gebruikssporen'). Voor 'gebruiken' zeg je *utiliser*." },
    { id: "ff3", question: "Betekent **rare**: raar of zeldzaam?", answer: "zeldzaam", context: "Weird = bizarre", explanation: "**Rare** betekent zeldzaam. Voor 'raar' of 'gek' gebruik je woorden als *bizarre* of *drôle*." },
    { id: "ff4", question: "Betekent **actuellement**: eigenlijk of momenteel?", answer: "momenteel", context: "Actually = en fait", explanation: "**Actuellement** betekent op dit moment (nu). Voor 'eigenlijk' of 'in feite' gebruik je *en fait*." }
]);

// --- TONE DETECTIVE (Houding vd Auteur) ---
addQuestions("tone-detective", 1, [
    { id: "td1", question: "Is de toon **élogieux** positief of negatief?", answer: "positief", context: "Lovend", explanation: "**Élogieux** komt van 'éloge' (loftuiting). De auteur spreekt dus met veel lof over het onderwerp." },
    { id: "td2", question: "Is de toon **indigné** positief of negatief?", answer: "negatief", context: "Verontwaardigd", explanation: "**Indigné** geeft aan dat de auteur boos of verontwaardigd is over een situatie." },
    { id: "td3", question: "Wat betekent een **sceptique** houding?", answer: "twijfelend", context: "Sceptisch/Kritisch", explanation: "De auteur plaatst kanttekeningen en gelooft niet zomaar alles wat er beweerd wordt." },
    { id: "td4", question: "Wat betekent **rassurant**?", answer: "geruststellend", context: "Positief", explanation: "**Rassurant** komt van 'rassurer' (geruststellen). De toon is bedoeld om zorgen weg te nemen." }
]);

// --- REFERENCE RELAY (Verwijswoorden) ---
addQuestions("reference-relay", 1, [
    { id: "rr1", question: "C'est l'homme **dont** je parle. Wat betekent 'dont'?", answer: "over wie", context: "Slaat terug op l'homme", acceptedAnswers: ["van wie"], explanation: "**Dont** is een betrekkelijk voornaamwoord dat gebruikt wordt bij werkwoorden met 'de' (parler de). 'De man *over wie* ik praat'." },
    { id: "rr2", question: "La raison pour **laquelle** il part. Wat betekent 'laquelle'?", answer: "welke", context: "Slaat terug op la raison", explanation: "**Laquelle** wordt gebruikt na een voorzetsel (pour) en moet rijmen op het geslacht van het zelfstandig naamwoord (la raison)." },
    { id: "rr3", question: "Voici twee livres. **Celui-ci** est à moi. Welk boek is dat?", answer: "deze", context: "Dichtbij (dit exemplaar)", explanation: "**Celui-ci** verwijst naar de dichtstbijzijnde of laatst genoemde optie (dit exemplaar hier)." }
]);

// --- LIT HISTORY (Literatuur) ---
addQuestions("lit-history", 1, [
    { id: "lh1", question: "Wie schreef 'L'Étranger' (Existentialisme)?", answer: "camus", context: "Albert Camus", explanation: "Albert Camus is een sleutelfiguur in het existentialisme en het absurdisme. 'L'Étranger' is zijn bekendste roman." },
    { id: "lh2", question: "Welke 19e-eeuwse stroming draait om gevoel en natuur (Victor Hugo)?", answer: "romantiek", context: "Romantisme", explanation: "De Romantiek benadrukte de subjectieve ervaring, de kracht vd natuur en de emotie van het individu." },
    { id: "lh3", question: "Hoe noem je een versregel van 12 lettergrepen?", answer: "alexandrin", context: "Klassieke poëzie", explanation: "De alexandrijn is de standaardversregel in de klassieke Franse poëzie en tragedie." },
    { id: "lh4", question: "Wat is 'enjambement'?", answer: "doorlopen van de zin", context: "Zin stopt niet bij einde regel", explanation: "Bij een enjambement loopt de grammaticale zin door over het einde van de versregel heen, vaak voor een dramatisch effect." }
]);

// --- ESSAY EXPERT (Formeel Schrijven) ---
addQuestions("essay-expert", 1, [
    { id: "ee1", question: "Vervang 'beaucoup' door een formeler alternatief.", answer: "énormément", context: "Of: maints, nombreux", acceptedAnswers: ["nombreux", "plusieurs"], explanation: "In een formeel essay klinken woorden als 'nombreux' of 'énormément' stijlvoller dan het simpele 'beaucoup'." },
    { id: "ee2", question: "Wat is een formele start van een brief?", answer: "monsieur", context: "Niet 'Salut' of 'Bonjour'", acceptedAnswers: ["madame", "madame, monsieur"], explanation: "In zakelijke Franse brieven begin je altijd met 'Madame, Monsieur' of alleen de titel, zonder de naam." },
    { id: "ee3", question: "Vervang 'Je pense' door een betoog-zin.", answer: "je suis d'avis", context: "Mening geven", acceptedAnswers: ["selon moi", "il est indéniable"], explanation: "'Je ben van mening dat...' (Je suis d'avis que) is sterker en formeler dan 'Ik denk' (Je pense)." }
]);
