
import { createInfiniteEngine } from "../../../../math/ui/modules/gym/engines/AIGymAdapter";

// Een kleine startvoorraad zodat de leerling meteen kan beginnen (geen wachttijd)
const BIO_BACKUP = [
    {
        id: "bio-start-1",
        question: "Wat is de functie van mitochondriën?",
        answer: "energievoorziening",
        context: "Celbiologie",
        explanation: "Mitochondriën zijn de 'energiefabrieken' van de cel; hier vindt de aerobe dissimilatie (verbranding van glucose) plaats om ATP te produceren."
    },
    {
        id: "bio-start-2",
        question: "Welk hormoon reguleert de bloedsuikerspiegel na het eten?",
        answer: "insuline",
        context: "Hormoonstelsel",
        explanation: "Na een maaltijd stijgt de bloedsuikerspiegel. Insuline zorgt ervoor dat cellen glucose opnemen en de lever glucose opslaat als glycogeen."
    }
];

export const InfiniteBioEngine = createInfiniteEngine(
    "infinite-bio",
    "Bio-Brain",
    "Biologie VWO",
    "Focus op: Celbiologie, DNA-replicatie, Dissimilatie en Ecologie.",
    BIO_BACKUP
);
