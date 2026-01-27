import { InteractiveComponent } from "@shared/utils/typeGuards";
import { ComponentType, lazy, LazyExoticComponent } from 'react';

export interface StandardizedEngineProps {
    component: InteractiveComponent;
    mastery?: 'novice' | 'competent' | 'expert';
    onInteraction?: (newConfig: InteractiveComponent['config']) => void;
    allowedControls?: string[] | 'all';
}

// Helper to adapt engines that expect 'config' and specific props
const adaptConfigEngine = (importer: () => Promise<Record<string, unknown>>, exportName: string = 'default') => {
    return lazy(async () => {
        const module = await importer() as Record<string, unknown>;
        const Component = module[exportName] as ComponentType<Record<string, unknown>>;
        return {
            default: (props: StandardizedEngineProps) => (
                <Component
                    config={props.component.config as Record<string, unknown>}
                    onUpdate={props.onInteraction} // Normalize 'onInteraction' -> 'onUpdate'
                    mastery={props.mastery}
                    // Pass everything else just in case
                    {...props}
                    // Explicitly override to ensure correct mapping if needed
                    allowedControls={props.allowedControls}
                />
            )
        };
    });
};

// Helper for engines that need the full 'component' object (e.g. WaveEngine, MathEngine)
const adaptComponentEngine = (importer: () => Promise<Record<string, unknown>>, exportName: string = 'default') => {
    return lazy(async () => {
        const module = await importer() as Record<string, unknown>;
        const Component = module[exportName] as ComponentType<Record<string, unknown>>;
        return {
            default: (props: StandardizedEngineProps) => (
                <Component
                    component={props.component as unknown as InteractiveComponent}
                    mastery={props.mastery}
                    onInteraction={props.onInteraction}
                />
            )
        };
    });
};

// Helper for Biology (needs 'type' explicitly)
const adaptBiologyEngine = () => {
    return lazy(async () => {
        const module = await import('./engines/BiologyEngine');
        const Component = module.BiologyEngine;
        return {
            default: (props: StandardizedEngineProps) => (
                <Component
                    type={props.component.type}
                    config={props.component.config}
                    mastery={props.mastery}
                    onUpdate={props.onInteraction}
                />
            )
        };
    });
};

// Helper for Physics Simulation (needs specific props)
const adaptPhysicsEngine = () => {
    return lazy(async () => {
        const module = await import('./engines/PhysicsEngine');
        const Component = module.PhysicsEngine;
        return {
            default: (props: StandardizedEngineProps) => (
                <Component
                    config={props.component.config as Record<string, unknown>}
                    onUpdate={props.onInteraction}
                    allowedControls={props.allowedControls}
                    mastery={props.mastery}
                />
            )
        };
    });
};

// --- THE REGISTRY ---

export const COMPONENT_REGISTRY: Record<string, LazyExoticComponent<ComponentType<StandardizedEngineProps>>> = {
    // SCIENCE - BIOLOGY
    'biology-process': adaptBiologyEngine(),
    'biology-feedback': adaptBiologyEngine(),
    'biology-genetics': adaptBiologyEngine(),
    'biology-ecology': adaptBiologyEngine(),

    // SCIENCE - CHEMISTRY
    'chemistry-molecule': adaptBiologyEngine(),
    'chemistry-reaction': lazy(async () => {
        const { ChemistryEngine } = await import('./engines/ChemistryEngine');
        return { default: (p: StandardizedEngineProps) => <ChemistryEngine type={p.component.type} config={p.component.config as Record<string, unknown>} mastery={p.mastery} /> };
    }),
    'chemistry-crystal': lazy(async () => {
        const { ChemistryEngine } = await import('./engines/ChemistryEngine');
        return { default: (p: StandardizedEngineProps) => <ChemistryEngine type={p.component.type} config={p.component.config as Record<string, unknown>} mastery={p.mastery} /> };
    }),

    // SCIENCE - PHYSICS
    'physics-simulation': adaptPhysicsEngine(),
    'physics-wave': adaptComponentEngine(() => import('./engines/WaveEngine'), 'WaveEngine'),
    'physics-quantum': adaptComponentEngine(() => import('./engines/QuantumEngine'), 'QuantumEngine'),
    'physics-field': adaptComponentEngine(() => import('./engines/ElectromagneticEngine'), 'ElectromagneticEngine'),
    'physics-circuit': adaptComponentEngine(() => import('./engines/CircuitEngine'), 'CircuitEngine'),

    // MATH
    'math-function': adaptComponentEngine(() => import('./engines/MathEngine'), 'MathEngine'),
    'math-geometry': adaptComponentEngine(() => import('./engines/MathEngine'), 'MathEngine'),
    'math-probability': adaptComponentEngine(() => import('./engines/MathEngine'), 'MathEngine'),
    'data-analysis': adaptComponentEngine(() => import('./engines/DataEngine'), 'DataEngine'),
    'model-fitting': adaptComponentEngine(() => import('./engines/ModelingEngine'), 'ModelingEngine'),
    'market-graph': adaptConfigEngine(() => import('./engines/shared/MarketGraph'), 'MarketGraph'), // Takes config/mastery

    // HUMANITIES
    'philosophy-logic': adaptComponentEngine(() => import('./engines/PhilosophyEngine'), 'PhilosophyEngine'),
    'philosophy-ethics': adaptComponentEngine(() => import('./engines/PhilosophyEngine'), 'PhilosophyEngine'),
    'dutch-analysis': adaptComponentEngine(() => import('./engines/DutchEngine'), 'DutchEngine'),
    'dutch-writing': adaptComponentEngine(() => import('./engines/DutchEngine'), 'DutchEngine'),
    'language-vocab': adaptComponentEngine(() => import('./engines/LanguageEngine'), 'LanguageEngine'),
    'language-grammar': adaptComponentEngine(() => import('./engines/LanguageEngine'), 'LanguageEngine'),

    // UTILITY
    'research-browser': adaptComponentEngine(() => import('./engines/ResearchEngine'), 'ResearchEngine'),
    'research-notes': adaptComponentEngine(() => import('./engines/ResearchEngine'), 'ResearchEngine'),
    'concept-map': adaptConfigEngine(() => import('./engines/shared/ConceptMap'), 'ConceptMap'),
};
