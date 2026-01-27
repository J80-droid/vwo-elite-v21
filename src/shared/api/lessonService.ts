/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AIConfig,
  DidacticConfig,
  LearningIntent,
  QuizQuestion,
  SavedLesson,
  SourceReliability,
  StudyMaterial,
} from "@shared/types/index";

import { chatWithSocraticCoach } from "./gemini/chat";
import { generateQuizFromMaterials } from "./gemini/quiz";
import { generateLesson } from "./gemini/study";
import { getPersonaForSubject } from "./personas";

export const LessonService = {
  /**
   * Genereert een volledige lesstructuur via Gemini
   */
  generateLesson: async (
    subject: string,
    materials: StudyMaterial[],
    intent: LearningIntent,
    reliability: SourceReliability,
    lang: string = "nl",
    aiConfig?: AIConfig,
    didacticConfig?: DidacticConfig,
    onProgress?: (stage: string, percentage: number) => void,
    onStatus?: (status: string, message: string) => void,
  ): Promise<SavedLesson> => {
    try {
      let persona = getPersonaForSubject(subject);

      // Check for User Override
      if (aiConfig?.personaOverrides && aiConfig.personaOverrides[persona.id]) {
        console.log(
          `[LessonService] Using override for persona: ${persona.id}`,
        );
        persona = { ...persona, ...aiConfig.personaOverrides[persona.id] };
      }

      const configWithPersona = {
        ...aiConfig,
        activePersona: persona,
        didacticConfig,
      };

      const result = await generateLesson(
        materials,
        subject,
        lang as any,
        configWithPersona as any,
        onProgress,
        onStatus
      );

      return {
        ...result,
        id: result.id || crypto.randomUUID(),
        subject,
        createdAt: Date.now(),
        intent,
        sourceReliability: reliability,
        sections: result.sections || [],
        summary: result.summary || "",
        keyConcepts: result.keyConcepts || [],
      } as any;
    } catch (error) {
      console.error("LessonService.generateLesson failed:", error);
      throw error;
    }
  },

  /**
   * Genereert quizvragen voor de 'Simulator' modus via Gemini
   */
  generateExam: async (
    materials: StudyMaterial[],
    difficulty: "easy" | "medium" | "hard" = "medium",
    lang: string = "nl",
    aiConfig?: AIConfig,
  ): Promise<QuizQuestion[]> => {
    try {
      const result = await generateQuizFromMaterials(
        materials,
        lang as any,
        aiConfig,
        { difficulty },
      );
      return result.questions as QuizQuestion[];
    } catch (error) {
      console.error("LessonService.generateExam failed:", error);
      throw error;
    }
  },

  /**
   * Chatten met de lesstof via Socratic Coach
   */
  askTutor: async (
    question: string,
    subject: string,
    context?: string,
    lang: string = "nl",
    aiConfig?: AIConfig,
  ): Promise<string> => {
    try {
      let persona = getPersonaForSubject(subject);

      // Check for User Override
      if (aiConfig?.personaOverrides && aiConfig.personaOverrides[persona.id]) {
        persona = { ...persona, ...aiConfig.personaOverrides[persona.id] };
      }

      const configWithPersona = {
        ...aiConfig,
        activePersona: persona,
      };

      return await chatWithSocraticCoach(
        [], // Empty history for single question if not provided elsewhere
        question,
        lang as any,
        "socratic",
        "socratic",
        configWithPersona as any,
        `Onderwerp: ${subject}. ${context || ""}`,
      );
    } catch (error) {
      console.error("LessonService.askTutor failed:", error);
      return "Excuses, de tutor service is tijdelijk niet beschikbaar.";
    }
  },
};
