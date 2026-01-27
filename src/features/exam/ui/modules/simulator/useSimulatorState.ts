import { ExamIndexEntry } from "@shared/types/dashboard";
import { SimulatorData } from "@shared/types/exam";
import { useCallback, useEffect } from "react";

import { useExamContext } from "../../../hooks/ExamContext";

const DEFAULT_SIM_DATA: SimulatorData = {
  stepIndex: 0,
  variables: {},
  logs: [],
  code: "",
  exams: [],
  selectedSubject: "",
  selectedExam: null,
  simState: "idle",
  questionLabel: "",
  studentAnswer: "",
  selfScore: 50,
  aiResult: null,
};

export const useSimulatorState = () => {
  const { examData, updateExamData } = useExamContext();
  const data: SimulatorData = { ...DEFAULT_SIM_DATA, ...examData.simulator };

  const update = useCallback(
    (partial: Partial<SimulatorData>) => {
      updateExamData("simulator", partial);
    },
    [updateExamData],
  );

  // Load Index on Mount (if empty)
  useEffect(() => {
    if (data.exams && data.exams.length === 0) {
      fetch("/exams/index.json")
        .then((r) => (r.ok ? r.json() : []))
        .then((exams) => {
          update({
            exams,
            selectedSubject:
              exams.length > 0
                ? (Array.from(
                    new Set(exams.map((e: ExamIndexEntry) => e.subject)),
                  )[0] as string)
                : "",
          });
        });
    }
  }, [data.exams, update]);

  return { data, update };
};
