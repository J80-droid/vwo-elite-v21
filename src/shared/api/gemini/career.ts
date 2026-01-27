/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from "@google/generative-ai";

import { getSettingsSQL } from "../sqliteService";

// System prompt that defines the persona and rules
const CAREER_COACH_SYSTEM_PROMPT = `
Je bent de "Elite Career Coach", een hoogwaardige, academische loopbaanbegeleider specifiek voor VWO-leerlingen (5/6 VWO).
Je doel is om de leerling te helpen bij profielkeuze, studiekeuze en loopbaanoriëntatie.
Je baseert je advies ALTIJD op de aangeleverde "LOB Data" (Big Five en RIASEC scores) als die beschikbaar zijn.

**Jouw Stijl:**
- Socratisch: Stel vragen terug om de leerling te laten nadenken.
- Academisch niveau: Gebruik volwassen taal, maar blijf toegankelijk.
- Kritisch: Daag de leerling uit ("Weet je zeker dat X bij je past gezien je lage score op Y?").
- Motiverend: Focus op talenten en mogelijkheden.

**Instructies:**
- Analyseer de Big Five en RIASEC scores.
- Big Five: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism.
- RIASEC: Realistic, Investigative, Artistic, Social, Enterprising, Conventional.
- Als er geen data is, vraag de leerling om eerst de tests te doen voor beter advies.
- Geef concrete studievoorbeelden (WO niveau) die passen bij het profiel.
- Verwijs naar Nederlandse universiteiten (TUD, UvA, EUR, etc.) of top internationaal.
`;

export const chatWithCareerCoach = async (
  message: string,
  history: any[],
  context: { bigFive: any; riasec: any },
) => {
  try {
    const settings = await getSettingsSQL();
    const apiKey =
      settings?.aiConfig?.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("No API key configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Construct history for Gemini
    // We limit history to last 10 messages to save tokens context window
    const recentHistory = history.slice(-10).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Inject context into the user's latest message implicitly or via system instruction if supported (Gemini 1.5 Pro supports system instructions better, but 1.0 Pro uses prompting)
    // We will prepend the system prompt + context to the chat logic.

    const contextStr = `
        [CONTEXT DATA]
        Big Five Scores: ${JSON.stringify(context.bigFive || "Niet beschikbaar")}
        RIASEC Scores: ${JSON.stringify(context.riasec || "Niet beschikbaar")}
        [END CONTEXT]
        `;

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: CAREER_COACH_SYSTEM_PROMPT + contextStr }],
        },
        {
          role: "model",
          parts: [
            {
              text: "Begrepen. Ik ben klaar om de leerling te coachen op basis van hun profiel.",
            },
          ],
        },
        ...recentHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Coach Error:", error);
    throw error;
  }
};
