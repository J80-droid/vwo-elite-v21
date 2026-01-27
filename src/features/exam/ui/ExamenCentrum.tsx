import { ExamModule } from "@shared/types/exam";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";

import { ExamProvider, useExamContext } from "../hooks/ExamContext";
import { ExamLayout } from "./ExamLayout";

const ExamenCentrumWrapper: React.FC = () => {
  const { module } = useParams();
  const { setActiveModule } = useExamContext();

  // Sync URL -> Context
  useEffect(() => {
    const validModules: string[] = [
      "simulator",
      "trainer",
      "quiz",
      "dashboard",
      "results",
    ];
    if (module && validModules.includes(module)) {
      setActiveModule(module as ExamModule);
    } else {
      setActiveModule("dashboard");
    }
  }, [module, setActiveModule]);

  return <ExamLayout />;
};

export { ExamProvider } from "../hooks/ExamContext";

export const ExamenCentrum: React.FC = () => {
  return (
    <ExamProvider initialModule="dashboard">
      <ExamenCentrumWrapper />
    </ExamProvider>
  );
};
