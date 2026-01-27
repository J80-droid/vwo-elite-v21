import { assign, fromPromise, type NonReducibleUnknown, setup } from "xstate";

export interface TutorContext {
  topic: string;
  history: Array<{
    role: "user" | "assistant";
    content: string;
    metadata?: {
      reasoning?: Array<{
        id: string;
        label: string;
        status: "pending" | "active" | "completed";
        timestamp: number;
      }>;
      confidence?: number;
    };
  }>;
  lastUserMessage: string | null;
  currentConcept: string | null;
  hintLevel: number;
  frustrationScore: number;
  reasoningSteps: Array<{
    id: string;
    label: string;
    status: "pending" | "active" | "completed";
    timestamp: number;
  }>;
  confidence: number;
  simulationState?: {
    objects: Record<string, unknown>;
    isRunning: boolean;
    timestamp: number;
  };
}

export type TutorEvent =
  | { type: "USER_MESSAGE"; message: string }
  | {
    type: "AI_RESPONSE";
    message: string;
    intent?: "question" | "hint" | "explanation";
  }
  | { type: "ADD_REASONING_STEP"; step: string }
  | { type: "UPDATE_CONFIDENCE"; score: number }
  | { type: "RESOLVED" }
  | { type: "GIVE_UP" }
  | { type: "AI_ERROR"; message: string }
  | { type: "HYDRATE"; state: TutorContext };

export const tutorMachine = setup({
  types: {
    context: {} as TutorContext,
    events: {} as TutorEvent,
    input: {} as { topic?: string; context?: TutorContext },
  },
  actors: {
    classifyIntent: fromPromise<{ intent: string }, NonReducibleUnknown>(
      async () => {
        // Default mock implementation
        return { intent: "question" };
      },
    ),
    generateOpener: fromPromise<
      string,
      { topic?: string; context?: TutorContext }
    >(async ({ input: _ }) => {
      return "Thinking of a question...";
    }),
    evaluateAnswer: fromPromise<
      string,
      { answer: string | null; context: TutorContext }
    >(async ({ input: _ }) => {
      return "Evaluating...";
    }),
  },
  actions: {
    persistState: (_) => {
      // Implementation provided by consumer (useTutor)
    },
    hydrateState: assign({
      topic: ({ event }) => (event.type === "HYDRATE" ? event.state.topic : ""),
      history: ({ event }) =>
        event.type === "HYDRATE" ? event.state.history : [],
      currentConcept: ({ event }) =>
        event.type === "HYDRATE" ? event.state.currentConcept : null,
      hintLevel: ({ event }) =>
        event.type === "HYDRATE" ? event.state.hintLevel : 0,
      reasoningSteps: ({ event }) =>
        event.type === "HYDRATE" ? event.state.reasoningSteps : [],
      confidence: ({ event }) =>
        event.type === "HYDRATE" ? event.state.confidence : 0,
    }),
    logUserMessage: assign({
      lastUserMessage: ({ event }) =>
        event.type === "USER_MESSAGE" ? event.message : null,
      history: ({ context, event }) => {
        if (event.type === "USER_MESSAGE") {
          return [
            ...context.history,
            { role: "user" as const, content: event.message },
          ];
        }
        return context.history;
      },
    }),
    logAiResponse: assign({
      history: ({ context, event }) => {
        if (event.type === "AI_RESPONSE") {
          // Capture current reasoning steps as completed
          const reasoning = context.reasoningSteps.map((s) => ({
            ...s,
            status: "completed" as const,
          }));
          return [
            ...context.history,
            {
              role: "assistant" as const,
              content: event.message,
              metadata: {
                reasoning: reasoning.length > 0 ? reasoning : undefined,
                confidence:
                  context.confidence > 0 ? context.confidence : undefined,
              },
            },
          ];
        } else if (event.type === "AI_ERROR") {
          return [
            ...context.history,
            { role: "assistant" as const, content: `Error: ${event.message} ` },
          ];
        }
        return context.history;
      },
      reasoningSteps: [],
      confidence: 0,
    }),
    addReasoningStep: assign({
      reasoningSteps: ({ context, event }) => {
        if (event.type === "ADD_REASONING_STEP") {
          const newHistory = context.reasoningSteps.map((s) =>
            s.status === "active" ? { ...s, status: "completed" as const } : s,
          );
          return [
            ...newHistory,
            {
              id: Date.now().toString(),
              label: event.step,
              status: "active" as const,
              timestamp: Date.now(),
            },
          ];
        }
        return context.reasoningSteps;
      },
    }),
    updateConfidence: assign({
      confidence: ({ event }) =>
        event.type === "UPDATE_CONFIDENCE" ? event.score : 0,
    }),
    incrementHint: assign({
      hintLevel: ({ context }) => context.hintLevel + 1,
    }),
    resetTutor: assign({
      topic: "",
      history: [],
      currentConcept: null,
      hintLevel: 0,
      frustrationScore: 0,
      lastUserMessage: null,
      reasoningSteps: [],
      confidence: 0,
    }),
  },
  guards: {
    isFrustrated: ({ context }) => context.frustrationScore > 3,
    isResolved: ({ event }) => event.type === "RESOLVED",
  },
}).createMachine({
  id: "socraticTutor",
  initial: "idle",
  context: {
    topic: "",
    history: [],
    currentConcept: null,
    hintLevel: 0,
    frustrationScore: 0,
    lastUserMessage: null,
    reasoningSteps: [],
    confidence: 0,
  },
  states: {
    idle: {
      on: {
        USER_MESSAGE: {
          target: "analyzing",
          actions: ["logUserMessage", "persistState"],
        },
        HYDRATE: { actions: "hydrateState" },
      },
    },
    analyzing: {
      invoke: {
        src: "classifyIntent",
        input: ({ context }) => ({
          lastMessage: context.lastUserMessage,
          history: context.history,
        }),
        onDone: { target: "questioning" },
        onError: { target: "idle" },
      },
      on: {
        ADD_REASONING_STEP: { actions: "addReasoningStep" },
        UPDATE_CONFIDENCE: { actions: "updateConfidence" },
      },
    },
    questioning: {
      invoke: {
        src: "generateOpener",
        input: ({ context }) => ({ topic: context.topic, context }),
        onDone: {
          actions: [
            {
              type: "logAiResponse",
              params: ({ event }) => ({
                message: event.output,
                intent: "question",
              }),
            },
            "persistState",
          ],
        },
        onError: {
          target: "idle",
          actions: [
            {
              type: "logAiResponse",
              params: ({ event }) => ({
                message: String(event.error),
                intent: "explanation",
              }),
            },
            "persistState",
          ],
        },
      },
      on: {
        ADD_REASONING_STEP: { actions: "addReasoningStep" },
        UPDATE_CONFIDENCE: { actions: "updateConfidence" },
        USER_MESSAGE: { target: "evaluating", actions: "logUserMessage" },
        AI_RESPONSE: { actions: "logAiResponse" },
        AI_ERROR: { target: "idle", actions: "logAiResponse" },
        GIVE_UP: "explaining",
      },
    },
    evaluating: {
      invoke: {
        src: "evaluateAnswer",
        input: ({ context }) => ({ answer: context.lastUserMessage, context }),
        onDone: {
          // Start simplified: always ask follow up or hint
          actions: [
            {
              type: "logAiResponse",
              params: ({ event }) => ({
                message: event.output,
                intent: "question",
              }),
            },
            "persistState",
          ],
        },
        onError: {
          target: "idle",
          actions: [
            {
              type: "logAiResponse",
              params: ({ event }) => ({
                message: String(event.error),
                intent: "explanation",
              }),
            },
            "persistState",
          ],
        },
      },
      on: {
        ADD_REASONING_STEP: { actions: "addReasoningStep" },
        UPDATE_CONFIDENCE: { actions: "updateConfidence" },
        AI_RESPONSE: [
          {
            target: "hinting",
            guard: ({ context }) => context.hintLevel < 3,
            actions: "logAiResponse",
          },
          { target: "questioning", actions: "logAiResponse" },
        ],
        AI_ERROR: { target: "idle", actions: "logAiResponse" },
      },
    },
    hinting: {
      entry: "incrementHint",
      on: {
        ADD_REASONING_STEP: { actions: "addReasoningStep" },
        UPDATE_CONFIDENCE: { actions: "updateConfidence" },
        USER_MESSAGE: { target: "evaluating", actions: "logUserMessage" },
        AI_RESPONSE: { actions: "logAiResponse" },
        AI_ERROR: { target: "idle", actions: "logAiResponse" },
      },
    },
    explaining: {
      on: {
        ADD_REASONING_STEP: { actions: "addReasoningStep" },
        UPDATE_CONFIDENCE: { actions: "updateConfidence" },
        USER_MESSAGE: { target: "analyzing", actions: "logUserMessage" },
        AI_RESPONSE: { actions: "logAiResponse" },
        AI_ERROR: { target: "idle", actions: "logAiResponse" },
        RESOLVED: "resolved",
      },
    },
    resolved: { type: "final" },
  },
});
