import { Suspense } from "react";

import { useUserSettings } from "../../logic/hooks/useUserSettings";
import { Button } from "../components/Button";

// Sub-component that consumes the promise via 'use'
const SettingsForm = () => {
  const settings = useUserSettings();

  const toggleTheme = () => {
    // Toggle 'dark' class on html element (Tailwind v4)
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <h2 className="text-xl font-semibold mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <span>Dark Mode</span>
          {/* Using standard Button, not inline styles */}
          <Button onClick={toggleTheme} variant="outline">
            Toggle Theme ({settings.theme})
          </Button>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <h2 className="text-xl font-semibold mb-4">Data</h2>
        <pre className="bg-black/20 p-4 rounded text-sm font-mono text-green-400">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export const MainUserSettingsLayout = () => {
  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-white">
      <header className="p-4 border-b border-white/10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          UserSettings Module
        </h1>
      </header>
      <main className="flex-1 relative overflow-auto p-8">
        <Suspense
          fallback={
            <div className="text-blue-400 animate-pulse">
              Loading settings...
            </div>
          }
        >
          <SettingsForm />
        </Suspense>
      </main>
    </div>
  );
};
