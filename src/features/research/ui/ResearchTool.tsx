import { useTranslations } from "@shared/hooks/useTranslations";
import React from "react";
import { Navigate, useParams } from "react-router-dom";

import { ResearchProvider, useResearchContext } from "../hooks/ResearchContext";
import { ResearchLayout } from "./ResearchLayout";

const ResearchToolInner: React.FC = () => {
  // Initialize hooks
  useTranslations();
  const { activeModule } = useResearchContext();

  return <ResearchLayout>{activeModule}</ResearchLayout>;
};

const ResearchTool: React.FC = () => {
  const { module } = useParams();

  // Validate module if needed, or default to a safe one
  if (!module) {
    return <Navigate to="/research" replace />;
  }

  return (
    <ResearchProvider initialModule={module}>
      <ResearchToolInner />
    </ResearchProvider>
  );
};

// Default export for lazy loading
export default ResearchTool;
