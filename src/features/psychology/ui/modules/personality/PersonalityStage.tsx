import { Fingerprint } from "lucide-react";
import React from "react";

const PersonalityStage: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-slate-500 font-outfit">
    <Fingerprint size={64} className="mb-4 opacity-20" />
    <h2 className="text-xl font-bold mb-2 uppercase tracking-widest text-white/50">
      Persoonlijkheid Lab
    </h2>
    <p className="text-sm font-light">
      Big Five test en Myers-Briggs verkenner binnenkort.
    </p>
  </div>
);

export default PersonalityStage;
