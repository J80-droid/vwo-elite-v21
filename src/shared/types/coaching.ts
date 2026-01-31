export interface CoachingSessionAnalytics {
    language: string;
    fragments?: string; // Essential moments
    terminology?: string; // New terms/definitions
    takeaways?: string; // 3 key points
    masteryScore?: number; // 0-100
    learningGaps?: string; // Concepts to improve
    correctionLog?: string; // Student errors vs corrections
    flashcards?: string; // Q&A pairs
    testQuestions?: string; // Tomorrow's self-test
    studyAdvice?: string; // Next steps
    confidenceScore?: number; // 0-100
    interactionRatio?: number; // user:coach speak ratio
    sentiment?: string; // emotional tone

    // VWO-Elite Expansion
    // Exam Focus
    pitfalls?: string;
    syllabusLinks?: string;
    examVocab?: string;
    structureScore?: number;
    // Academic Skills
    argumentationQuality?: string;
    criticalThinking?: string;
    scientificNuance?: string;
    sourceUsage?: string;
    // Metacognition
    bloomLevel?: string;
    estStudyTime?: string;
    examPriority?: string;
    crossLinks?: string;
    // Wellbeing
    anxietyLevel?: string;
    cognitiveLoad?: string;
    growthMindset?: string;
    learningStateVector?: string; // JSON vector for mastery heatmap
}

export interface CoachingSessionRecord extends CoachingSessionAnalytics {
    id: string;
    subject: string;
    transcript: string;
    summary?: string;
    duration: number;
    date: string;
}
