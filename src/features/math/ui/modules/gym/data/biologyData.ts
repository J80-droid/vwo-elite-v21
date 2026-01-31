import { STATIC_QUESTIONS, StaticQuestion } from "../engines/StaticDataEngine";

const addQuestions = (key: string, level: number, questions: StaticQuestion[]) => {
    if (!STATIC_QUESTIONS[key]) STATIC_QUESTIONS[key] = {};
    STATIC_QUESTIONS[key][level] = questions;
};

// --- BIO ENERGY ---
addQuestions("bio-energy", 1, [
    { id: "be1", question: "Hoeveel moleculen $CO_2$ zijn nodig voor 1 molecuul glucose?", answer: "6", context: "Fotosynthese", explanation: "De bruto reactie is $6 CO_2 + 12 H_2O \\to C_6H_{12}O_6 + 6 O_2 + 6 H_2O$. Er zijn dus 6 koolstofdioxide moleculen nodig voor de 6 koolstofatomen in glucose." },
    { id: "be2", question: "Welk gas komt vrij als bijproduct van de lichtreacties?", answer: "zuurstof", context: "Fotosynthese", explanation: "Tijdens de fotolyse van water worden watermoleculen gesplitst in $H^+$, elektronen en $O_2$. Het zuurstofgas verlaat de plant via de huidmondjes." },
    { id: "be3", question: "Wat is de netto-reactievergelijking van fotosynthese? ($6CO_2 + 6H_2O \\to \\dots$)", answer: "C6H12O6+6O2", context: "Fotosynthese", explanation: "Lichtenergie wordt vastgelegd in glucose ($C_6H_{12}O_6$) waarbij zuurstof vrijkomt." },
]);
addQuestions("bio-energy", 3, [
    { id: "be4", question: "Wat is de bruto ATP winst van de glycolyse per molecuul glucose?", answer: "4", context: "Dissimilatie" },
    { id: "be5", question: "Wat is de netto ATP winst van de glycolyse per molecuul glucose?", answer: "2", context: "Dissimilatie" },
    { id: "be6", question: "Hoeveel $FADH_2$ moleculen ontstaan er in de citroenzuurcyclus per molecuul glucose?", answer: "2", context: "Krebs Cyclus" },
]);

// --- CIRCULATION PUMP ---
addQuestions("circulation-pump", 1, [
    { id: "cp1", question: "Welk type bloedvat bevat kleppen en vervoert bloed naar het hart toe?", answer: "ader", context: "Bloedvaten", acceptedAnswers: ["aders", "venen", "vene"], explanation: "Aders (venen) hebben een lage bloeddruk en gebruiken kleppen om te voorkomen dat bloed terugstroomt, vooral vanuit de benen." },
    { id: "cp2", question: "Via welke hartkamer wordt bloed de aorta in gepompt?", answer: "linker kamer", context: "Hartanatomie", acceptedAnswers: ["linkerhartkamer", "LV"], explanation: "De linker kamer heeft een dikke gespierde wand om het bloed met hoge druk de grote bloedsomloop (via de aorta) in te sturen." },
    { id: "cp3", question: "Welke bloedvaten vervoeren altijd zuurstofarm bloed (behalve de longslagader)?", answer: "ader", context: "Bloedvaten", acceptedAnswers: ["aders", "venen"], explanation: "In de grote bloedsomloop vervoeren aders het zuurstofarme bloed terug naar het hart." },
]);
addQuestions("circulation-pump", 2, [
    { id: "cp4", question: "Hoe noemen we de fase waarin de hartkamers samentrekken?", answer: "systole", context: "Hartcyclus" },
    { id: "cp5", question: "Hoe noemen we de fase waarin het hart ontspant en zich vult?", answer: "diastole", context: "Hartcyclus" },
]);

// --- HORMONE CONTROL ---
addQuestions("hormone-control", 1, [
    { id: "hc1", question: "Welk hormoon verlaagt de bloedsuikerspiegel?", answer: "insuline", context: "Bloedsuiker", explanation: "Insuline (geproduceerd in de alvleesklier) stimuleert de opname van glucose in cellen en de omzetting naar glycogeen in de lever." },
    { id: "hc2", question: "Welk hormoon verhoogt de bloedsuikerspiegel door glycogeen af te breken?", answer: "glucagon", context: "Bloedsuiker", explanation: "Glucagon is de tegenhanger van insuline; het zorgt dat de lever glycogeen weer omzet in glucose als de bloedsuikerspiegel te laag is." },
]);
addQuestions("hormone-control", 2, [
    { id: "hc3", question: "Welk hormoon uit de hypofyse stimuleert de rijping van een follikel?", answer: "FSH", context: "Menstruatiecyclus", explanation: "FSH staat voor Follikel Stimulerend Hormoon. Het zet de eierstokken aan tot het rijpen van een nieuwe eicel." },
    { id: "hc4", question: "Een piek in welk hormoon veroorzaakt de ovulatie?", answer: "LH", context: "Menstruatiecyclus", explanation: "Een scherpe stijging (piek) van het Luteïniserend Hormoon (LH) zorgt voor de eisprong (ovulatie)." },
    { id: "hc5", question: "Welk hormoon wordt geproduceerd door het gele lichaam (corpus luteum)?", answer: "progesteron", context: "Menstruatiecyclus", explanation: "Progesteron houdt het baarmoederslijmvlies dik en bereidt het voor op een eventuele innesteling." },
]);

// --- IMMUNO DEFENSE ---
addQuestions("immuno-defense", 1, [
    { id: "id1", question: "Welke cellen produceren antistoffen?", answer: "B-cellen", context: "Specifieke afweer", acceptedAnswers: ["B-lymfocyten", "plasma-cellen"], explanation: "B-lymfocyten differentiëren tot plasmacellen, die vervolgens specifieke antistoffen (immunoglobulinen) uitscheiden." },
    { id: "id2", question: "Welke cellen vallen direct geïnfecteerde lichaamscellen aan?", answer: "Cytotoxische T-cellen", context: "Specifieke afweer", acceptedAnswers: ["Tc-cellen"], explanation: "Tc-cellen herkennen antigenen op het oppervlak van eigen cellen (bijv. virus-geïnfecteerd) en doden deze door perforines uit te scheiden." },
]);
addQuestions("immuno-defense", 2, [
    { id: "id3", question: "Is een vaccinatie een vorm van actieve of passieve immunisatie?", answer: "actief", context: "Immunisatie", acceptedAnswers: ["actieve immunisatie"] },
    { id: "id4", question: "Is het krijgen van antistoffen via moedermelk actief of passief?", answer: "passief", context: "Immunisatie", acceptedAnswers: ["passieve immunisatie"] },
]);

// --- MEMBRANE TRANSPORT ---
addQuestions("membrane-transport", 1, [
    { id: "mt1", question: "Een cel wordt in een oplossing geplaatst met een **lagere** osmotische waarde dan de cel zelf. Hoe noemen we deze oplossing?", answer: "hypotoon", context: "Osmose", explanation: "Hypo (lager/onder). Een hypotone oplossing heeft minder opgeloste deeltjes dan de cel, waardoor water de cel ín stroomt." },
    { id: "mt2", question: "Wat gebeurt er met een dierlijke cel in een hypotone oplossing?", answer: "lyse", context: "Osmose effecten", acceptedAnswers: ["knappen", "zwellen"], explanation: "Omdat een dierlijke cel geen celwand heeft, kan hij de druk van het instromende water niet aan en zal hij zwellen en uiteindelijk knappen (lyse)." },
]);
addQuestions("membrane-transport", 3, [
    { id: "mt3", question: "Hoe noemen we de druk van de celinhoud tegen de celwand?", answer: "turgor", context: "Plantencellen" },
    { id: "mt4", question: "Hoe noemen we de toestand waarin het celmembraan loslaat van de celwand?", answer: "plasmolyse", context: "Plantencellen" },
]);

// --- NEURAL NET ---
addQuestions("neural-net", 1, [
    { id: "nn1", question: "Welke ionen stromen de cel **in** tijdens de depolarisatie?", answer: "natrium", context: "Actiepotentiaal", acceptedAnswers: ["Na+"], explanation: "Tijdens de depolarisatie gaan de natriumpoorten open en stromen $Na^+$-ionen met de concentratiegradiënt mee de cel in, waardoor de interne spanning stijgt." },
    { id: "nn2", question: "Welke ionen stromen de cel **uit** tijdens de repolarisatie?", answer: "kalium", context: "Actiepotentiaal", acceptedAnswers: ["K+"], explanation: "Bij de repolarisatie gaan de kaliumpoorten open en verlaten $K^+$-ionen de cel, waardoor de rustpotentiaal weer wordt hersteld." },
    { id: "nn3", question: "Wat is de gemiddelde rustpotentiaal van een neuron (in mV)?", answer: "-70", context: "Rustpotentiaal", explanation: "Door de werking van de natrium-kaliumpomp en de verschillende permeabiliteit van de membraan is de binnenkant van de cel negatief geladen ten opzichte van de buitenkant." },
]);
addQuestions("neural-net", 2, [
    { id: "nn4", question: "Hoe noemen we de signaalstoffen die in de synaptische spleet worden afgegeven?", answer: "neurotransmitters", context: "Synaps", explanation: "Voorbeelden zijn acetylcholine en dopamine. Ze dragen de prikkel chemisch over naar de volgende cel." },
    { id: "nn5", question: "Wat is het effect van een **inhiberende** neurotransmitter op de postsynaptische potentiaal?", answer: "hyperpolarisatie", context: "Synaps", explanation: "Een inhiberende transmitter opent kanalen (bijv. voor $Cl^-$) waardoor de membraanpotentiaal nog negatiever wordt, wat het moeilijker maakt om een drempelwaarde te bereiken." },
]);

// --- NITROGEN CYCLE ---
addQuestions("nitrogen-cycle", 1, [
    { id: "nc1", question: "Hoe noemen we de omzetting van $NH_4^+$ naar $NO_3^-$?", answer: "nitrificatie", context: "Stikstofkringloop", explanation: "Nitrificerende bacteriën zetten ammonium eerst om in nitriet en daarna in nitraat. Dit proces vereist zuurstof (aerobe omstandigheden)." },
    { id: "nc2", question: "Welke bacteriën zetten $N_2$ om in $NH_3$?", answer: "stikstoffixerende bacteriën", context: "Stikstofkringloop", explanation: "Deze bacteriën (zoals *Rhizobium* in wortelknolletjes) kunnen de sterke drievoudige binding van stikstofgas verbreken en bruikbaar maken voor planten." },
]);
addQuestions("nitrogen-cycle", 2, [
    { id: "nc3", question: "In welke planten vinden we knolletjesbacteriën?", answer: "vlinderbloemigen", context: "Symbiose", explanation: "Vlinderbloemigen (zoals klaver, bonen en erwten) leven in symbiose met stikstoffixerende bacteriën in hun wortels." },
    { id: "nc4", question: "Welke bacteriën zetten nitraat weer om in stikstofgas ($N_2$)?", answer: "denitrificerende bacteriën", context: "Stikstofkringloop", explanation: "In zuurstofarme (anaerobe) bodems gebruiken deze bacteriën nitraat als elektronenacceptor, waarbij stikstofgas vrijkomt in de atmosfeer." },
]);

// --- ENZYMEN (Domein B3) ---
addQuestions("enzymes", 1, [
    { id: "enz1", question: "Wat gebeurt er met een enzym als de temperatuur te hoog wordt?", answer: "denaturatie", context: "Structuurverandering", acceptedAnswers: ["denatureren", "het denatureert"], explanation: "Boven de optimumtemperatuur verliest het eiwit zijn ruimtelijke structuur (denaturatie), waardoor het substraat niet meer past." },
    { id: "enz2", question: "Hoe noemen we de stof waar een enzym op inwerkt?", answer: "substraat", context: "Sleutel-slot", explanation: "Het substraat is de specifieke beginstof die door het enzym wordt omgezet in producten." }
]);
addQuestions("enzymes", 2, [
    { id: "enz3", question: "Hoe noemen we de plek op het enzym waar het substraat bindt?", answer: "actief centrum", context: "Binding", explanation: "Het actieve centrum heeft een unieke vorm die precies past bij één specifiek substraat (slot-sleutel principe)." },
    { id: "enz4", question: "Bij welk type remming bindt een stof op het actieve centrum, waardoor het substraat er niet meer bij kan?", answer: "competitieve remming", context: "Inhibitie", explanation: "De remmer lijkt qua vorm op het substraat en 'concurreert' (competitie) om dezelfde plek op het enzym." }
]);

// --- ECOLOGIE (Domein D) ---
addQuestions("ecology", 1, [
    { id: "eco1", question: "Hoe noemen we alle biotische en abiotische factoren in een bepaald gebied samen?", answer: "ecosysteem", context: "Definitie" },
    { id: "eco2", question: "Zijn predatoren en ziekteverwekkers biotische of abiotische factoren?", answer: "biotisch", context: "Factoren" }
]);
addQuestions("ecology", 2, [
    { id: "eco3", question: "Hoeveel procent van de energie wordt gemiddeld doorgegeven naar het volgende trofische niveau?", answer: "10", context: "Energiestroom (%)", acceptedAnswers: ["10%", "tien"] },
    { id: "eco4", question: "Hoe noemen we de maximale populatiegrootte die een ecosysteem kan dragen?", answer: "draagkracht", context: "Carrying capacity", acceptedAnswers: ["carrying capacity"] }
]);
