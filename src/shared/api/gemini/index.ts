/**
 * Gemini Services - Barrel Export
 *
 * This file re-exports all domain-specific Gemini service modules
 * for convenient importing throughout the application.
 */

export {
  analyzePWSSources,
  checkAcademicWriting,
  checkOriginality,
  checkResearchDesign,
  findAcademicSources,
  generateAPACitations,
  generateLiteratureMatrix,
  generateMindMap,
  summarizePaper,
} from "./academic";
export * from "./career";
export { chatWithSocraticCoach, generateChatSummary } from "./chat";
export { solveCalculus } from "./code";
export { generateDebateTurn, judgeDebate } from "./debate";
export * from "./helpers";
export { generateLanguageFeedback } from "./language";
export { connectLiveSession } from "./live";
export { generatePodcastAudio } from "./media";
export { analyzePronunciation } from "./pronunciation";
export { analyzeBlurting, generateLesson } from "./study";
export { detectLanguage, translateText } from "./translation";
export {
  analyzeSnapshot,
  analyzeVideo,
  extractMathFunction,
  solveProblem,
  transcribeHandwriting,
} from "./vision";
