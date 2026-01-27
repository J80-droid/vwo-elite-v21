import React, { useState } from "react";

import { QuantumFloat } from "./QuantumFloat/QuantumFloat";

// Future: Import NeuralSidebar, ContextBubbles

export type TutorDisplayMode =
  | "quantum_float"
  | "neural_sidebar"
  | "context_bubbles";

interface TutorInterfaceProps {
  initialMode?: TutorDisplayMode;
}

/**
 * TutorInterface "Shell"
 *
 * Acts as the main entry point for the Socratic Tutor UI.
 * It determines WHICH interface variant to load based on user settings.
 */
export const TutorInterface: React.FC<TutorInterfaceProps> = ({
  initialMode = "quantum_float",
}) => {
  const [mode, _setMode] = useState<TutorDisplayMode>(initialMode);

  // Render the appropriate interface
  switch (mode) {
    case "quantum_float":
      return <QuantumFloat />;

    // Future implementations:
    // case 'neural_sidebar': return <NeuralSidebar />;
    // case 'context_bubbles': return <ContextBubbles />;

    default:
      return <QuantumFloat />;
  }
};
