import { STATIC_QUESTIONS, StaticQuestion } from "../engines/StaticDataEngine";

const addQuestions = (key: string, level: number, questions: StaticQuestion[]) => {
    if (!STATIC_QUESTIONS[key]) STATIC_QUESTIONS[key] = {};
    STATIC_QUESTIONS[key][level] = questions;
};

// --- SIGNAL DETECTIVE (Signaalwoorden) ---
addQuestions("signal-detective", 1, [
    { id: "sd1", question: "What is the Dutch meaning of: **however**?", answer: "echter", context: "Contrast", acceptedAnswers: ["maar"], explanation: "'However' is een signaalwoord van tegenstelling. Het wordt gebruikt om een nuance of contrast aan te brengen ten opzichte van de vorige zin." },
    { id: "sd2", question: "What is the Dutch meaning of: **consequently**?", answer: "bijgevolg", context: "Cause/Effect", acceptedAnswers: ["dus", "daardoor", "gevolg"], explanation: "'Consequently' geeft een resultaat of gevolg aan. Het geeft aan wat er gebeurt naar aanleiding van iets anders." },
    { id: "sd3", question: "What relationship does **'moreover'** indicate?", answer: "addition", context: "Structure", explanation: "'Moreover' wordt gebruikt om extra informatie toe te voegen aan een argument (opsomming/toevoeging)." },
    { id: "sd4", question: "What relationship does **'despite'** indicate?", answer: "contrast", context: "Structure", explanation: "'Despite' (ondanks) geeft aan dat iets gebeurt ondanks een beperkende factor (tegenstelling)." }
]);

// --- VOCAB ACADEMIC (Woordenschat) ---
addQuestions("vocab-academic", 1, [
    { id: "va1", question: "What does **ambiguity** mean in Dutch?", answer: "onduidelijkheid", context: "Abstract", acceptedAnswers: ["dubbelzinnigheid"], explanation: "Ambiguity betekent dat iets op meerdere manieren uitgelegd kan worden (dubbelzinnigheid) of simpelweg niet eenduidig is." },
    { id: "va2", question: "Give a synonym for **to enhance**.", answer: "to improve", context: "Synonyms", acceptedAnswers: ["improve", "boost"], explanation: "To enhance betekent het verbeteren of versterken van de kwaliteit of waarde van iets." },
    { id: "va3", question: "Does **eventually** mean 'mogelijk' or 'uiteindelijk'?", answer: "uiteindelijk", context: "False Friends", explanation: "**Eventually** is een 'false friend'. Het betekent *uiteindelijk*. Het woord voor 'mogelijk' of 'misschien' is *possibly* of *perhaps*." },
    { id: "va4", question: "What does **reluctance** mean?", answer: "tegenzin", context: "Attitude", acceptedAnswers: ["weerstand", "onwil"], explanation: "Reluctance is de onwil of aarzeling om iets te doen (terughoudendheid)." }
]);

// --- FORMAL WRITER (Schrijfvaardigheid) ---
addQuestions("formal-writer", 1, [
    { id: "fw1", question: "Replace informal **'I think'** with a formal phrase.", answer: "in my opinion", context: "Essay Writing", acceptedAnswers: ["it is my view", "i believe"], explanation: "In formele essays vermijd je 'I think'. Gebruik liever 'In my opinion' of 'It is argued that...' voor een professionelere toon." },
    { id: "fw2", question: "Replace **'But'** at the start of a sentence with a formal alternative.", answer: "however", context: "Linking words", acceptedAnswers: ["nevertheless"], explanation: "Het is beter om een zin niet te beginnen met 'But'. 'However' of 'Nevertheless' zijn formele alternatieven." },
    { id: "fw3", question: "Formal alternative for **'So'**?", answer: "therefore", context: "Linking words", acceptedAnswers: ["consequently", "hence"], explanation: "'Therefore' of 'Consequently' klinken academischer dan het simpele 'So'." },
    { id: "fw4", question: "Formal alternative for **'About'** (e.g. talking about...)?", answer: "regarding", context: "Prepositions", acceptedAnswers: ["concerning", "with regard to"], explanation: "In zakelijke correspondentie gebruik je 'regarding', 'concerning' of 'with regard to' in plaats van 'about'." }
]);

// --- LIT TERMS (Literatuur) ---
addQuestions("lit-terms", 1, [
    { id: "lt1", question: "Which term describes a comparison using 'as' or 'like'?", answer: "simile", context: "Figures of Speech", explanation: "Een simile (vergelijking) gebruikt expliciet 'as' of 'like' (bijv. 'as brave as a lion'). Een metafoor doet dat niet." },
    { id: "lt2", question: "What is **alliteration**?", answer: "repetition of consonants", context: "Sound devices", acceptedAnswers: ["consonant repetition", "beginrijm"], explanation: "Alliteratie is de herhaling van dezelfde medeklinker aan het begin van woorden die dicht bij elkaar staan (bijv. 'Seven silver swans')." },
    { id: "lt3", question: "What do we call a hint about future events in a story?", answer: "foreshadowing", context: "Narrative structure", explanation: "Foreshadowing is een literaire techniek waarbij de auteur subtiele aanwijzingen geeft over wat er later in het verhaal gaat gebeuren." },
    { id: "lt4", question: "What is an **omniscient narrator**?", answer: "all-knowing narrator", context: "Perspective", acceptedAnswers: ["alwetende verteller"], explanation: "Omni (alles) + scient (wetend). Deze verteller kent de gedachten en gevoelens van alle personages." }
]);

// --- REFERENCE RADAR (Verwijswoorden) ---
addQuestions("reference-radar", 1, [
    { id: "rr1", question: "John bought a car and a bike. **The latter** was red. What was red?", answer: "the bike", context: "Reference", explanation: "**The former** verwijst naar het eerste genoemde item (de auto), **the latter** verwijst naar het laatst genoemde item (de fiets)." },
    { id: "rr2", question: "Sarah and Emily went home. **The former** forgot her keys. Who forgot them?", answer: "sarah", context: "Reference", explanation: "**The former** slaat terug op de eerste persoon in de lijst, in dit geval Sarah." },
    { id: "rr3", question: "The company announced results. **This** caused stocks to rise. What is 'This'?", answer: "the announcement", context: "Reference", acceptedAnswers: ["the results", "announcing results"], explanation: "'This' verwijst vaak naar de hele voorgaande zin of het hoofdevenement (de aankondiging van de resultaten)." }
]);

// --- IDIOM IMPACT (Idioom) ---
addQuestions("idiom-impact", 1, [
    { id: "ii1", question: "What does **'to sit on the fence'** mean?", answer: "undecided", context: "Expressions", acceptedAnswers: ["geen keuze maken", "not choosing"], explanation: "Iemand die 'op het hek zit', weigert een kant te kiezen in een conflict of discussie." },
    { id: "ii2", question: "Preposition: He is famous ___ his art.", answer: "for", context: "Grammar", explanation: "In het Engels is de vaste voorzetselcombinatie 'to be famous **for** something'." },
    { id: "ii3", question: "Preposition: She is capable ___ winning.", answer: "of", context: "Grammar", explanation: "De vaste combinatie is 'to be capable **of** + -ing vorm'." },
    { id: "ii4", question: "Meaning: **'Once in a blue moon'**.", answer: "rarely", context: "Frequency", acceptedAnswers: ["zelden", "very rarely"], explanation: "Dit idioom wordt gebruikt voor iets dat bijna nooit voorkomt (zeer zelden)." }
]);

// --- FUNCTION FINDER (Tekstfuncties) ---
addQuestions("function-finder", 1, [
    { id: "ff1", question: "Function of: **'for instance'**?", answer: "illustration", context: "Text Structure", acceptedAnswers: ["example", "elaboration"], explanation: "'For instance' (bijvoorbeeld) heeft de functie om een algemene bewering te verduidelijken met een specifiek voorbeeld (illustratie)." },
    { id: "ff2", question: "Function of: **'admittedly'**?", answer: "concession", context: "Argumentation", acceptedAnswers: ["toegeving"], explanation: "'Admittedly' (toegegeven) wordt gebruikt om een tegenargument te erkennen voordat je je eigen standpunt verdedigt (concessie/toegeving)." },
    { id: "ff3", question: "Function of: **'to summarize'**?", answer: "summary", context: "Ending", explanation: "Deze frase geeft aan dat de belangrijkste punten van de tekst kort worden herhaald (samenvatting)." }
]);

// --- TONE TUNER (Cito Tone Words) ---
addQuestions("tone-tuner", 1, [
    { id: "tt1", question: "What does a **'laudatory'** tone mean?", answer: "praising", context: "Positive attitude", acceptedAnswers: ["full of praise", "lovend"], explanation: "Een 'laudatory' tekst prijst het onderwerp aan (denk aan een 'laudatio' bij een uitreiking)." },
    { id: "tt2", question: "What does an **'indignant'** tone mean?", answer: "angry", context: "Negative attitude", acceptedAnswers: ["verontwaardigd", "annoyed"], explanation: "Iemand die 'indignant' is, voelt zich onrechtvaardig behandeld en reageert verontwaardigd of boos." },
    { id: "tt3", question: "What does a **'detached'** tone mean?", answer: "objective", context: "Neutral attitude", acceptedAnswers: ["unemotional", "neutral", "afstandelijk"], explanation: "'Detached' betekent dat de auteur afstand bewaart en alleen de feiten presenteert zonder eigen emoties te tonen." },
    { id: "tt4", question: "What does **'mocking'** mean?", answer: "making fun of", context: "Sarcastic/Negative", acceptedAnswers: ["belachelijk makend", "spotten"], explanation: "Een 'mocking' toon is bedoeld om iemand of iets belachelijk te maken." }
]);

// --- COLLOCATION KING (Dunglish Preventie) ---
addQuestions("collocation-king", 1, [
    { id: "ck1", question: "You don't 'make' homework, you ... homework.", answer: "do", context: "Common mistakes", explanation: "Dit is een veelgemaakte fout (Dunglish). Bij huiswerk gebruik je altijd het werkwoord **do**." },
    { id: "ck2", question: "You don't 'make' a photo, you ... a photo.", answer: "take", context: "Common mistakes", explanation: "In het Engels 'neem' je een foto: **to take a photo**." },
    { id: "ck3-fix", question: "You don't say 'heavy rain' in Dutch style (zware regen), but it IS correct in English. Try this: A ... of soap (stuk zeep).", answer: "bar", context: "Partitives", explanation: "Voor vaste stoffen zoals zeep of chocolade gebruik je het 'partitive' woord **bar**." },
    { id: "ck4", question: "You don't 'close' a contract, you ... a contract.", answer: "sign", context: "Business English", acceptedAnswers: ["conclude"], explanation: "Hoewel je in het Nederlands een contract 'sluit', zeg je in het Engels meestal **sign** of **conclude** a contract." }
]);

// --- LIT HISTORY (Literatuurgeschiedenis) ---
addQuestions("lit-history-en", 1, [
    { id: "lh1", question: "Which period is associated with emotion and nature (Wordsworth, Coleridge)?", answer: "romanticism", context: "1798-1837", explanation: "De Romantiek was een reactie op de industriële revolutie en de verlichting; het verheerlijkte de natuur en de individuele emotie." },
    { id: "lh2", question: "Who wrote 'Hamlet' and 'Macbeth'?", answer: "shakespeare", context: "Renaissance", explanation: "William Shakespeare is de beroemdste toneelschrijver uit de Engelse Renaissance (Elizabethan era)." },
    { id: "lh3", question: "Which WW1 poet wrote 'Dulce et Decorum Est'?", answer: "wilfred owen", context: "War Poets", explanation: "Wilfred Owen schreef rauwe, realistische gedichten over de verschrikkingen van de loopgravenoorlog." }
]);
