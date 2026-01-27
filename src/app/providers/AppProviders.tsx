import { VoiceCoachProvider } from "@shared/lib/contexts/VoiceCoachContext";
import { LanguageProvider } from "@shared/lib/LanguageContext";
import { queryClient } from "@shared/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import React, { ReactNode } from "react";

import { AppBootstrap } from "@/components/AppBootstrap";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DidacticMonitor } from "@/components/features/DidacticMonitor";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * AppProviders Component
 *
 * Centralizes all application-level providers for cleaner entry points
 * and improved testability.
 *
 * Note: SettingsProvider is NOT included here because it uses router hooks
 * (useParams, useNavigate). It is wrapped at the route level in router.tsx.
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <DidacticMonitor />
      <ErrorBoundary>
        <LanguageProvider>
          <AppBootstrap>
            <VoiceCoachProvider>{children}</VoiceCoachProvider>
          </AppBootstrap>
        </LanguageProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};
