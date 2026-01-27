import React, { Suspense } from "react";

import { LoadingSpinner } from "../../shared/ui/loading";

interface SuspenseWrapperProps {
  children: React.ReactNode;
  text?: string;
}

export const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
  children,
  text,
}) => (
  <Suspense fallback={<LoadingSpinner {...(text ? { text } : {})} />}>
    {children}
  </Suspense>
);
