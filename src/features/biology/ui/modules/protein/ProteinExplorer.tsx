import { ProteinAnalysis } from "./ProteinAnalysis";
import { ProteinParameters } from "./ProteinParameters";
import { ProteinSidebar } from "./ProteinSidebar";
import { ProteinStage } from "./ProteinStage";

export { ProteinAnalysis, ProteinParameters, ProteinSidebar, ProteinStage };

// Also export a combined view if needed elsewhere
import React from "react";
export const ProteinExplorer: React.FC = () => {
    return (
        <div className="grid grid-cols-12 h-screen">
            <div className="col-span-3 border-r border-white/10 p-4">
                <ProteinSidebar />
            </div>
            <div className="col-span-6 relative">
                <ProteinStage />
            </div>
            <div className="col-span-3 border-l border-white/10 p-4 space-y-6">
                <ProteinParameters />
                <ProteinAnalysis />
            </div>
        </div>
    );
};

export default ProteinExplorer;
