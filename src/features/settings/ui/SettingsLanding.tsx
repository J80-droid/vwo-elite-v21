// Import all module configs to register them
import "./modules";

import React from "react";

import { SettingsProvider } from "../hooks/SettingsContext";
import { useSettingsContent } from "./SettingsContent";
import { SettingsLayout } from "./SettingsLayout";

const SettingsInner: React.FC = () => {
  // Dynamic Content
  const { Stage } = useSettingsContent();

  return <SettingsLayout>{Stage}</SettingsLayout>;
};

export { SettingsProvider } from "../hooks/SettingsContext";

export const Settings: React.FC = () => {
  return (
    <SettingsProvider>
      <SettingsInner />
    </SettingsProvider>
  );
};
