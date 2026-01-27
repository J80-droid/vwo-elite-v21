import { logActivitySQL } from "@shared/api/sqliteService";
import { extractGraphFromLessons } from "@shared/lib/graphDataGenerator";
import { createStore } from "@shared/lib/storeFactory";
import { SavedLesson } from "@shared/types/index";

// Een simpele sanitizer helper voor backwards compatibility (Audit requirement)
const sanitizeLesson = (
  lesson: Partial<SavedLesson> & { id?: string },
): SavedLesson => ({
  ...lesson,
  id: lesson.id || crypto.randomUUID(),
  title: lesson.title || "Naamloze Les",
  subject: lesson.subject || "Algemeen",
  summary: lesson.summary || "",
  keyConcepts: Array.isArray(lesson.keyConcepts) ? lesson.keyConcepts : [],
  sections: Array.isArray(lesson.sections) ? lesson.sections : [], // Fallback voor corrupte data
  language: lesson.language || "nl",
  pitfalls: Array.isArray(lesson.pitfalls) ? (lesson.pitfalls as string[]) : [],
  quiz: Array.isArray(lesson.quiz) ? lesson.quiz : [],
  practiceQuestions: Array.isArray(lesson.practiceQuestions) ? (lesson.practiceQuestions as string[]) : [],
  createdAt:
    typeof lesson.createdAt === "number" ? lesson.createdAt : Date.now(),
});

export interface TopicMastery {
  topic: string; // Bijv. "Differentiëren" of "Koude Oorlog"
  mastery: number; // 0-100%
  lastQuizDate: number;
  lessonsGenerated: number;
}

interface SubjectProgress {
  subject: string;
  overallMastery: number;
  topics: Record<string, TopicMastery>;
}

interface LessonProgressState {
  progress: Record<string, SubjectProgress>; // Key = subject (lowercase)
  savedLessons: SavedLesson[]; // Global storage for all lessons

  // Actions
  logQuizResult: (subject: string, topic: string, score: number) => void;
  logLessonGenerated: (subject: string, topic: string) => void;

  // Lesson Management
  addLesson: (lesson: SavedLesson) => void;
  updateLesson: (id: string, updates: Partial<SavedLesson>) => void;
  deleteLesson: (id: string) => void;
  importLessons: (lessons: SavedLesson[]) => void;

  getSubjectMastery: (subject: string) => number;
  getWeakestTopics: (subject: string) => string[];

  // Graph
  getGraphData: (
    subjectFilter?: string,
  ) => ReturnType<typeof extractGraphFromLessons>;
}

export const useLessonProgressStore = createStore<LessonProgressState>(
  (set, get) => ({
    progress: {},
    savedLessons: [],

    logQuizResult: (subject, topic, score) => {
      const subjKey = subject.toLowerCase();
      // Log voor XP
      logActivitySQL(
        "quiz",
        `Quiz afgerond: ${subject} - ${topic}`,
        score > 5.5 ? 10 : 2,
      );

      set((state) => {
        const currentSubject = state.progress[subjKey] || {
          subject,
          overallMastery: 0,
          topics: {},
        };
        const currentTopic = currentSubject.topics[topic] || {
          topic,
          mastery: 0,
          lastQuizDate: 0,
          lessonsGenerated: 0,
        };

        // Update Topic Mastery (gewogen gemiddelde: 70% oud, 30% nieuw)
        const resultPercent = score * 10;
        const newMastery =
          currentTopic.mastery === 0
            ? resultPercent
            : currentTopic.mastery * 0.7 + resultPercent * 0.3;

        const updatedTopics = {
          ...currentSubject.topics,
          [topic]: {
            ...currentTopic,
            mastery: Math.round(newMastery),
            lastQuizDate: Date.now(),
          },
        };

        const topicsArr = Object.values(updatedTopics);
        const newOverall =
          topicsArr.reduce((acc, t) => acc + t.mastery, 0) / topicsArr.length;

        return {
          progress: {
            ...state.progress,
            [subjKey]: {
              ...currentSubject,
              topics: updatedTopics,
              overallMastery: Math.round(newOverall),
            },
          },
        };
      });
    },

    logLessonGenerated: (subject, topic) => {
      const subjKey = subject.toLowerCase();
      set((state) => {
        const currentSubject = state.progress[subjKey] || {
          subject,
          overallMastery: 0,
          topics: {},
        };
        const currentTopic = currentSubject.topics[topic] || {
          topic,
          mastery: 0,
          lastQuizDate: 0,
          lessonsGenerated: 0,
        };

        return {
          progress: {
            ...state.progress,
            [subjKey]: {
              ...currentSubject,
              topics: {
                ...currentSubject.topics,
                [topic]: {
                  ...currentTopic,
                  lessonsGenerated: currentTopic.lessonsGenerated + 1,
                },
              },
            },
          },
        };
      });
    },

    // --- LESSON MANAGEMENT ---
    addLesson: (lesson) =>
      set((state) => ({
        savedLessons: [sanitizeLesson(lesson), ...state.savedLessons],
      })),

    updateLesson: (id, updates) =>
      set((state) => ({
        savedLessons: state.savedLessons.map((l) =>
          l.id === id ? sanitizeLesson({ ...l, ...updates }) : l,
        ),
      })),

    deleteLesson: (id) =>
      set((state) => ({
        savedLessons: state.savedLessons.filter((l) => l.id !== id),
      })),

    importLessons: (lessons) =>
      set((state) => {
        const existingIds = new Set(state.savedLessons.map((l) => l.id));
        const sanitized = lessons.map(sanitizeLesson);
        const newLessons = sanitized.filter((l) => !existingIds.has(l.id));
        return { savedLessons: [...state.savedLessons, ...newLessons] };
      }),

    getSubjectMastery: (subject) => {
      return get().progress[subject.toLowerCase()]?.overallMastery || 0;
    },

    getWeakestTopics: (subject) => {
      const subj = get().progress[subject.toLowerCase()];
      if (!subj) return [];
      return Object.values(subj.topics)
        .sort((a, b) => a.mastery - b.mastery)
        .map((t) => t.topic)
        .slice(0, 3);
    },

    // --- GRAPH DATA ---
    getGraphData: (subjectFilter?: string) => {
      const state = get();
      const lessons = subjectFilter
        ? state.savedLessons.filter(
          (l) => l.subject?.toLowerCase() === subjectFilter.toLowerCase(),
        )
        : state.savedLessons;

      const subject = subjectFilter || "Knowledge Base";
      return extractGraphFromLessons(subject, lessons);
    },
  }),
  {
    name: "lesson-progress",
    sanitize: (state) => ({
      ...state,
      savedLessons: state.savedLessons.map(sanitizeLesson),
    }),
  },
);
