/* eslint-disable unused-imports/no-unused-vars */
/**
 * Mondeling Service
 * AI-powered oral exam simulation for language subjects
 */

import { resolveModel } from "@shared/lib/modelDefaults";

import type { AIConfig } from "../types";
import { getGeminiAPI } from "./geminiBase";

export interface MondelingQuestion {
  question: string;
  followUp?: string;
  category: "inhoud" | "thema" | "personages" | "stijl" | "context" | "mening";
  difficulty: "basis" | "verdiepend" | "kritisch";
}

export interface MondelingFeedback {
  score: number; // 1-10
  strengths: string[];
  improvements: string[];
  sampleAnswer?: string;
  followUpQuestion?: string;
}

export interface MondelingSession {
  bookTitle: string;
  bookAuthor: string;
  subject: string;
  questions: MondelingQuestion[];
  currentIndex: number;
  answers: { question: string; answer: string; feedback: MondelingFeedback }[];
}

/**
 * Generate oral exam questions for a book
 */
export async function generateMondelingQuestions(
  bookTitle: string,
  bookAuthor: string,
  subject: string,
  userNotes?: string,
  aiConfig?: AIConfig,
): Promise<MondelingQuestion[]> {
  const gemini = await getGeminiAPI(aiConfig?.geminiApiKey);
  const model = gemini.getGenerativeModel({
    model: resolveModel("gemini", "chat", aiConfig),
  });

  const prompt = `Je bent een VWO ${subject} docent die een mondeling afneemt over het boek "${bookTitle}" van ${bookAuthor}.

Genereer 8 examenvragen verdeeld over de volgende categorieën:
1. INHOUD: Vragen over de plot en gebeurtenissen
2. THEMA: Vragen over thematiek en boodschap
3. PERSONAGES: Vragen over karakterontwikkeling
4. STIJL: Vragen over schrijfstijl en literaire middelen
5. CONTEXT: Vragen over historische/maatschappelijke context
6. MENING: Persoonlijke reflectie en argumentatie

${userNotes ? `De leerling heeft deze notities gemaakt:\n${userNotes}\n` : ""}

Maak een mix van basis-, verdiepende- en kritische vragen.

Antwoord ALLEEN in dit JSON formaat:
{
    "questions": [
        {
            "question": "De vraag",
            "followUp": "Optionele vervolgvraag",
            "category": "inhoud|thema|personages|stijl|context|mening",
            "difficulty": "basis|verdiepend|kritisch"
        }
    ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid response format");

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.questions || [];
  } catch (error) {
    console.error("[MondelingService] Failed to generate questions:", error);
    // Return fallback questions
    return [
      {
        question: `Wat is het hoofdthema van "${bookTitle}"?`,
        category: "thema",
        difficulty: "basis",
      },
      {
        question: "Welk personage vind je het meest interessant en waarom?",
        category: "personages",
        difficulty: "verdiepend",
      },
      {
        question: "Hoe past dit boek in de literaire stroming van die periode?",
        category: "context",
        difficulty: "kritisch",
      },
    ];
  }
}

/**
 * Evaluate a student's answer and provide feedback
 */
export async function evaluateMondelingAnswer(
  bookTitle: string,
  bookAuthor: string,
  question: string,
  answer: string,
  subject: string,
  aiConfig?: AIConfig,
): Promise<MondelingFeedback> {
  const gemini = await getGeminiAPI(aiConfig?.geminiApiKey);
  const model = gemini.getGenerativeModel({
    model: resolveModel("gemini", "chat", aiConfig),
  });

  const prompt = `Je bent een VWO ${subject} docent die een mondeling beoordeelt.

Boek: "${bookTitle}" van ${bookAuthor}
Vraag: ${question}
Antwoord van de leerling: ${answer}

Beoordeel dit antwoord op VWO-niveau. Geef constructieve feedback.

Antwoord ALLEEN in dit JSON formaat:
{
    "score": 7,
    "strengths": ["Sterke punt 1", "Sterke punt 2"],
    "improvements": ["Verbeterpunt 1", "Verbeterpunt 2"],
    "sampleAnswer": "Een voorbeeldantwoord dat hoger zou scoren",
    "followUpQuestion": "Een vervolgvraag om dieper te graven (optioneel)"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid response format");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("[MondelingService] Failed to evaluate answer:", error);
    return {
      score: 6,
      strengths: ["Je hebt een antwoord gegeven"],
      improvements: ["Probeer concreter te zijn met voorbeelden uit het boek"],
    };
  }
}

/**
 * Generate a final assessment of the oral exam session
 */
export async function generateSessionSummary(
  session: MondelingSession,
  aiConfig?: AIConfig,
): Promise<{
  overallScore: number;
  summary: string;
  categoryScores: Record<string, number>;
  recommendations: string[];
}> {
  const gemini = await getGeminiAPI(aiConfig?.geminiApiKey);
  const model = gemini.getGenerativeModel({
    model: resolveModel("gemini", "chat", aiConfig),
  });

  const answersText = session.answers
    .map(
      (a, i) =>
        `V${i + 1}: ${a.question}\nA: ${a.answer}\nScore: ${a.feedback.score}`,
    )
    .join("\n\n");

  const prompt = `Analyseer deze mondeling sessie voor ${session.subject} over "${session.bookTitle}":

${answersText}

Geef een eindbeoordeling. Antwoord in JSON:
{
    "overallScore": 7.5,
    "summary": "Korte samenvatting van de prestatie",
    "categoryScores": {
        "inhoud": 7,
        "thema": 8,
        "personages": 6,
        "stijl": 7,
        "context": 8,
        "mening": 7
    },
    "recommendations": ["Aanbeveling 1", "Aanbeveling 2"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid response format");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("[MondelingService] Failed to generate summary:", error);
    const avgScore =
      session.answers.reduce((sum, a) => sum + a.feedback.score, 0) /
      session.answers.length;
    // ... existing code ...
    return {
      overallScore: Math.round(avgScore * 10) / 10,
      summary: "Sessie afgerond.",
      categoryScores: {},
      recommendations: ["Blijf oefenen met mondelinge presentaties"],
    };
  }
}

/**
 * Dynamic Chat Interface for Full Simulation
 */
export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export async function continueMondelingChat(
  history: ChatMessage[],
  bookTitle: string,
  bookAuthor: string,
  subject: string,
  aiConfig?: AIConfig,
): Promise<{ text: string; isExamFinished: boolean; score?: number }> {
  const gemini = await getGeminiAPI(aiConfig?.geminiApiKey);
  const model = gemini.getGenerativeModel({
    model: resolveModel("gemini", "chat", aiConfig),
  });

  const systemPrompt = `Je bent een strenge maar rechtvaardige VWO ${subject} examinator. Je neemt een mondeling examen af over "${bookTitle}" van ${bookAuthor}.
    
    Jouw doel:
    1. Stel vragen over inhoud, literatuurgeschiedenis, thematiek en interpretatie.
    2. Reageer op de antwoorden van de leerling:
       - Als het antwoord goed is, geef kort compliment en ga dieper in op de stof.
       - Als het zwak is, vraag door of vraag om verduidelijking.
    3. Houd het gesprek gaande als een echte dialoog, niet een stijve vragenlijst.
    
    Instructies:
    - Begin direct met de volgende vraag of reactie.
    - Spreek de leerling aan met "je/jij".
    - Als je genoeg informatie hebt (na ongeveer 5-8 interacties), sluit het examen dan af.
    - Geef bij het afsluiten een cijfer (1-10) en een korte onderbouwing.
    
    Format je antwoord als JSON als je besluit het examen te beëindigen:
    {
        "isFinished": true,
        "text": "Bedankt, we zijn klaar. [Onderbouwing]",
        "score": 7.5
    }
    
    Als het examen nog bezig is, antwoord gewoon met de tekst (geen JSON) van je volgende reactie/vraag.`;

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      ...history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      })),
    ],
  });

  try {
    const result = await chat.sendMessage(
      "Ga door met het examen. Reageer op mijn laatste antwoord of stel de eerste vraag.",
    );
    const text = result.response.text();

    // Check format
    if (text.trim().startsWith("{")) {
      try {
        const json = JSON.parse(text);
        return {
          text: json.text,
          isExamFinished: true,
          score: json.score,
        };
      } catch (e) {
        return { text, isExamFinished: false };
      }
    }

    return { text, isExamFinished: false };
  } catch (error) {
    console.error("Chat error:", error);
    return {
      text: "Excuses, ik begreep dat niet helemaal. Kun je dat herhalen?",
      isExamFinished: false,
    };
  }
}
