import React, { useState } from "react";

export const WhyReviewInput: React.FC<{
  onSubmit: (reflection: string) => void;
}> = ({ onSubmit }) => {
  const [reflection, setReflection] = useState("");

  return (
    <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg mt-4 mb-4 animate-fade-in">
      <h4 className="text-purple-300 font-bold mb-2 flex items-center gap-2">
        🧠 Metacognitie Check
      </h4>
      <p className="text-sm text-gray-300 mb-3">
        Wacht even. Voordat je de vraag opnieuw doet:
        <span className="text-white font-semibold block mt-1">
          {" "}
          Waarom dacht jij dat je vorige antwoord/stap goed was?
        </span>
        Probeer de denkfout te beschrijven.
      </p>
      <textarea
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        placeholder="Ik dacht dat..."
        className="w-full bg-gray-900 text-white p-3 rounded border border-gray-700 focus:border-purple-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
        rows={2}
      />
      <button
        onClick={() => onSubmit(reflection)}
        disabled={reflection.length < 5}
        className="mt-2 text-xs bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-3 py-1.5 rounded transition-colors font-medium"
      >
        Bevestig Reflectie & Start Herkansing
      </button>
    </div>
  );
};
