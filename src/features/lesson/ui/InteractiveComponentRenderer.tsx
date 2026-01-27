// Import Styles (Global CSS imports stay here or move to App Entry)
import 'reactflow/dist/style.css';

import { InteractiveComponent } from "@shared/utils/typeGuards";
import React, { Suspense } from "react";

import { COMPONENT_REGISTRY } from "./componentRegistry";
import { EngineErrorBoundary } from "./EngineErrorBoundary";

interface Props {
    component: InteractiveComponent;
    onInteraction?: (newConfig: InteractiveComponent['config']) => void;
    allowedControls?: string[] | 'all';
    mastery?: 'novice' | 'competent' | 'expert';
}

export const InteractiveComponentRenderer: React.FC<Props> = ({
    component,
    onInteraction,
    allowedControls,
    mastery = 'novice'
}) => {
    const Engine = COMPONENT_REGISTRY[component.type];

    if (!Engine) {
        return (
            <div className="p-10 border-2 border-dashed border-red-500/20 text-red-400 rounded-3xl text-center uppercase tracking-widest font-black">
                Unknown Component Engine: {component.type}
            </div>
        );
    }

    return (
        <EngineErrorBoundary>
            <Suspense fallback={
                <div className="h-64 flex items-center justify-center border border-white/5 bg-black/20 rounded-3xl">
                    <span className="text-slate-500 font-bold uppercase tracking-widest animate-pulse">
                        Loading Engine...
                    </span>
                </div>
            }>
                <Engine
                    component={component}
                    mastery={mastery}
                    onInteraction={onInteraction}
                    allowedControls={allowedControls}
                />
            </Suspense>
        </EngineErrorBoundary>
    );
};
