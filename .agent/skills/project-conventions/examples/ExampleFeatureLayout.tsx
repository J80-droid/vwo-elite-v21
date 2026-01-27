/**
 * Example: Elite Feature Component (DDD Structure)
 *
 * This demonstrates the correct architecture for a feature module.
 * Location: src/features/<feature-name>/ui/modules/
 */

import { Suspense } from "react";

import { useFeatureData } from "../../logic/hooks/useFeatureData";
import { FeatureCard } from "../components/FeatureCard";

// Sub-component that consumes data via React 19 `use` API
const FeatureContent = () => {
  const data = useFeatureData();

  return (
    <div className="grid gap-4 p-6">
      {data.items.map((item) => (
        <FeatureCard key={item.id} {...item} />
      ))}
    </div>
  );
};

/**
 * Main Layout Component
 *
 * @description Entry point for the feature module
 * @see Related: useFeatureData hook in logic/hooks/
 */
export const MainFeatureLayout = () => {
  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-white">
      <header className="p-4 border-b border-white/10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Feature Module
        </h1>
      </header>
      <main className="flex-1 relative overflow-auto">
        <Suspense
          fallback={<div className="animate-pulse p-4">Loading...</div>}
        >
          <FeatureContent />
        </Suspense>
      </main>
    </div>
  );
};
