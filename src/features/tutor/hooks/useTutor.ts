import { useOrchestratorStore } from "@shared/api/ai-brain/orchestratorProxyStore";
import { type TutorContext, tutorMachine } from "@vwo/business-logic";
import type { VwoApi } from "@vwo/shared-types";
import { useMachine } from "@xstate/react";
import { useEffect, useMemo, useRef } from "react";
import { fromPromise } from "xstate";

import { usePhysicsContext } from "./usePhysicsContext";

export function useTutor(initialTopic?: string) {
  const orchestrator = useOrchestratorStore();
  const physics = usePhysicsContext();
  const physicsRef = useRef(physics); // Ref to access current physics in async actors
  const api = (window as unknown as { vwoApi: VwoApi }).vwoApi;

  // Sync physics ref
  useEffect(() => {
    physicsRef.current = physics;
  }, [physics]);

  // Define Actors (Services) that implement the machine's logic
  const actors = useMemo(
    () => ({
      classifyIntent: fromPromise(async () => {
        // Short delay to simulate thought
        await new Promise((r) => setTimeout(r, 600));
        return { intent: "question" };
      }),

      generateOpener: fromPromise(
        // eslint-disable-next-line
        async ({
          input,
        }: {
          input: { topic?: string; context?: TutorContext };
        }) => {
          const { topic } = input;

          // 1. Simulate Reasoning
          await new Promise((r) => setTimeout(r, 1500));

          const phys = physicsRef.current;
          const physicsStr = phys ? `Sim State: ${JSON.stringify(phys)}` : "";
          const prompt = `Act as a Socratic Tutor. Topic: ${topic || "General Science"}. ${physicsStr} Generate a thought-provoking starting question. Keep it short.`;

          const response = await orchestrator.execute(prompt, {
            intent: "education_help",
          });
          return response;
        },
      ),

      evaluateAnswer: fromPromise(
        // eslint-disable-next-line
        async ({
          input,
        }: {
          input: { answer: string | null; context: TutorContext };
        }) => {
          const { answer } = input;

          await new Promise((r) => setTimeout(r, 2000));

          const phys = physicsRef.current;
          const prompt = `Student Answer: "${answer}". Physics Context: ${JSON.stringify(phys)}. Evaluate if correct and give a hint if wrong.`;

          const response = await orchestrator.execute(prompt, {
            intent: "education_help",
          });
          return response;
        },
      ),
    }),
    [orchestrator],
  ); // Re-create if orchestrator changes (it shouldn't often)

  // Provide the actors to the machine
  const machine = useMemo(
    () =>
      tutorMachine.provide({
        actors,
      }),
    [actors],
  );

  const [state, send] = useMachine(machine, {
    input: { topic: initialTopic || "General Science" },
  });

  // Hydrate state from DB on mount
  useEffect(() => {
    if (api?.invoke) {
      api.invoke("db:load-tutor-state").then((savedState: unknown) => {
        if (savedState) {
          // send({ type: 'HYDRATE', state: savedState });
          console.log("Hydrated state:", savedState);
        }
      });
    }
  }, [api]);

  // Handle topic changes
  useEffect(() => {
    // Could send event to set topic manually if needed
  }, [initialTopic]);

  return {
    state,
    send,
    history: state.context.history,
    currentMessage:
      state.context.history[state.context.history.length - 1]?.content,
    isIdle: state.matches("idle"),
    isThinking:
      state.matches("analyzing") ||
      state.matches("questioning") ||
      state.matches("evaluating"),
    reasoningSteps: state.context.reasoningSteps,
    confidence: state.context.confidence,
  };
}
