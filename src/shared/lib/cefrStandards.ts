export interface CEFRLevelDesc {
  code: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  label: string;
  description: string;
  skills: {
    listening: string;
    reading: string;
    speakingProduction: string;
    speakingInteraction: string;
    writing: string;
  };
}

export const CEFR_STANDARDS: Record<string, CEFRLevelDesc> = {
  A1: {
    code: "A1",
    label: "Basisgebruiker (Doorbraak)",
    description: "Bekende dagelijkse uitdrukkingen en eenvoudige zinnen.",
    skills: {
      listening:
        "Ik kan vertrouwde woorden en basiszinnen begrijpen die mezelf, mijn familie en directe concrete omgeving betreffen, wanneer de mensen langzaam en duidelijk spreken.",
      reading:
        "Ik kan vertrouwde namen, woorden en zeer eenvoudige zinnen begrijpen, bijvoorbeeld in mededelingen, op posters en in catalogi.",
      speakingProduction:
        "Ik kan eenvoudige uitdrukkingen en zinnen gebruiken om mijn woonomgeving en de mensen die ik ken, te beschrijven.",
      speakingInteraction:
        "Ik kan deelnemen aan een eenvoudig gesprek, wanneer de gesprekspartner bereid is om zaken in een langzamer spreektempo te herhalen of opnieuw te formuleren.",
      writing:
        "Ik kan een korte, eenvoudige ansichtkaart schrijven. Ik kan op formulieren persoonlijke details invullen.",
    },
  },
  A2: {
    code: "A2",
    label: "Basisgebruiker (Tussenstap)",
    description:
      "Bekend met veelgebruikte uitdrukkingen en kan gesprekken voeren over alledaagse zaken.",
    skills: {
      listening:
        "Ik kan zinnen en de meest frequente woorden begrijpen die betrekking hebben op gebieden die van direct persoonlijk belang zijn.",
      reading:
        "Ik kan zeer korte eenvoudige teksten lezen. Ik kan specifieke voorspelbare informatie vinden in eenvoudige, alledaagse teksten.",
      speakingProduction:
        "Ik kan een reeks uitdrukkingen en zinnen gebruiken om in eenvoudige bewoordingen mijn familie, leefomstandigheden en opleiding te beschrijven.",
      speakingInteraction:
        "Ik kan communiceren over eenvoudige en alledaagse taken die een eenvoudige en directe uitwisseling van informatie betreffen.",
      writing:
        "Ik kan korte, eenvoudige notities en boodschappen opschrijven. Ik kan een zeer eenvoudige persoonlijke brief schrijven.",
    },
  },
  B1: {
    code: "B1",
    label: "Zelfstandige gebruiker (Drempel)",
    description:
      "Kan eigen mening geven en ervaringen, dromen en verwachtingen beschrijven.",
    skills: {
      listening:
        "Ik kan de hoofdpunten begrijpen wanneer in duidelijk uitgesproken standaarddialect wordt gesproken over vertrouwde zaken.",
      reading:
        "Ik kan teksten begrijpen die hoofdzakelijk bestaan uit hoogfrequente, alledaagse of aan mijn werk gerelateerde taal.",
      speakingProduction:
        "Ik kan uitingen op een simpele manier aan elkaar verbinden om ervaringen, dromen en ambities te beschrijven. Ik kan redenen geven voor meningen.",
      speakingInteraction:
        "Ik kan onvoorbereid deelnemen aan een gesprek over onderwerpen die vertrouwd zijn of mijn persoonlijke belangstelling hebben.",
      writing:
        "Ik kan een eenvoudige samenhangende tekst schrijven over onderwerpen die vertrouwd of van persoonlijk belang zijn.",
    },
  },
  B2: {
    code: "B2",
    label: "Zelfstandige gebruiker (Uitzicht)",
    description:
      "Kan hoofdlijnen van complexe teksten begrijpen en spontaan deelnemen aan een gesprek.",
    skills: {
      listening:
        "Ik kan een langer betoog en lezingen begrijpen en zelfs complexe redeneringen volgen, wanneer het onderwerp redelijk vertrouwd is. Ik kan de meeste nieuws- en actualiteitenprogramma's begrijpen.",
      reading:
        "Ik kan artikelen en verslagen lezen die betrekking hebben op eigentijdse problemen. Ik kan eigentijds literair proza begrijpen.",
      speakingProduction:
        "Ik kan duidelijke, gedetailleerde beschrijvingen presenteren over een breed scala van onderwerpen binnen mijn interessegebied.",
      speakingInteraction:
        "Ik kan zodanig deelnemen aan een vloeiend en spontaan gesprek dat normale uitwisseling met moedertaalsprekers redelijk mogelijk is.",
      writing:
        "Ik kan een duidelijke, gedetailleerde tekst schrijven over een breed scala van onderwerpen. Ik kan een opstel of verslag schrijven met argumenten.",
    },
  },
  C1: {
    code: "C1",
    label: "Vaardige gebruiker (Effectief)",
    description:
      "Kan zichzelf vloeiend uitdrukken en taal flexibel gebruiken voor sociale, academische en professionele doeleinden.",
    skills: {
      listening:
        "Ik kan een langer betoog begrijpen, zelfs wanneer dit niet duidelijk gestructureerd is en relaties slechts impliciet zijn.",
      reading:
        "Ik kan lange en complexe feitelijke en literaire teksten begrijpen en stijlen waarderen. Ik kan gespecialiseerde artikelen begrijpen.",
      speakingProduction:
        "Ik kan duidelijke, gedetailleerde beschrijvingen geven over complexe onderwerpen, subthema's integreren en afronden met een conclusie.",
      speakingInteraction:
        "Ik kan mezelf vloeiend en spontaan uitdrukken zonder merkbaar naar uitdrukkingen te zoeken. Ik kan taal flexibel gebruiken.",
      writing:
        "Ik kan me in duidelijke, goed gestructureerde tekst uitdrukken en uitgebreid standpunten uiteenzetten in een aangepaste stijl.",
    },
  },
  C2: {
    code: "C2",
    label: "Vaardige gebruiker (Beheersing)",
    description:
      "Kan zonder moeite alles begrijpen en zich spontaan, zeer vloeiend en genuanceerd uitdrukken.",
    skills: {
      listening:
        "Ik kan moeiteloos gesproken taal begrijpen, in welke vorm dan ook, zelfs in snel moedertaaltempo.",
      reading:
        "Ik kan moeiteloos vrijwel alle vormen van de geschreven taal lezen, inclusief abstracte of linguïstisch complexe teksten.",
      speakingProduction:
        "Ik kan een duidelijke, goedlopende beschrijving of redenering presenteren in een stijl die past bij de context en met een logische structuur.",
      speakingInteraction:
        "Ik kan zonder moeite deelnemen aan elk gesprek en ben vertrouwd met idiomatische uitdrukkingen. Ik kan mezelf hernemen bij problemen.",
      writing:
        "Ik kan complexe brieven, verslagen of artikelen schrijven met een doeltreffende logische structuur. Ik kan kritieken op professionele werken schrijven.",
    },
  },
};

export const getCEFRSystemPrompt = (level: string) => {
  const data =
    CEFR_STANDARDS[level as keyof typeof CEFR_STANDARDS] || CEFR_STANDARDS.B2!;
  return `
    CEFR LEVEL: ${data.code} (${data.label})
    EXPECTATIONS:
    - Speaking: ${data.skills.speakingInteraction}
    - Listening: Requires user to understand: ${data.skills.listening}
    - Production: ${data.skills.speakingProduction}
    
    Adjust your vocabulary and speed to match this level perfectly.
    `;
};
