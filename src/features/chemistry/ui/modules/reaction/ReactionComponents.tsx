import React from "react";

import { ReactionLab } from "../../../../simulation";

export const ReactionSidebar: React.FC = () => (
  <div className="p-4 text-sm text-slate-400 italic">
    Selecteer reagentia en omstandigheden in het hoofdscherm om de reactie te
    starten.
  </div>
);

export const ReactionStage: React.FC = () => <ReactionLab />;
