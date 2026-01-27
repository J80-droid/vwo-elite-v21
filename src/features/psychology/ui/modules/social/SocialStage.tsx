import { Users } from "lucide-react";
import React from "react";

const SocialStage: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-slate-500 font-outfit">
    <Users size={64} className="mb-4 opacity-20" />
    <h2 className="text-xl font-bold mb-2 uppercase tracking-widest text-white/50">
      Sociale Psychologie
    </h2>
    <p className="text-sm font-light">
      Groepsdynamiek en conformiteit experimenten binnenkort.
    </p>
  </div>
);

export default SocialStage;
