// Public API for physics feature
// Only export components that are intended for cross-feature use

// Hooks for cross-feature use
export {
    type PhysicsLabContextValue,
    useModuleState,
    useOptionalPhysicsLabContext,
    usePhysicsLabContext} from "./hooks/usePhysicsLabContext";

// Gym engines for math feature
export { CircuitEngine } from "./ui/gym/engines/CircuitEngine";
export { DecayEngine } from "./ui/gym/engines/DecayEngine";
export { FlashcardEngine } from "./ui/gym/engines/flashcards/FlashcardEngine";
export { GraphEngine } from "./ui/gym/engines/GraphEngine";
export { IsolatorEngine } from "./ui/gym/engines/IsolatorEngine";
export { SigFigEngine } from "./ui/gym/engines/SigFigEngine";
export { UnitEngine } from "./ui/gym/engines/UnitEngine";
export { VectorEngine as PhysVectorEngine } from "./ui/gym/engines/VectorEngine";

// Gym hooks and components
export { useGymSound } from "./ui/gym/hooks/useGymSound";

// Tutor for cross-feature use
export { useTutor } from "./ui/tutor/useTutor";

// Optics utilities
export { calculateRayPath } from "./ui/modules/optics/opticsRaytracer";
export { useOpticsEngine } from "./ui/modules/optics/useOpticsEngine";

// Kinematics utilities
export { useKinematicsEngine } from "./ui/modules/kinematics/useKinematicsEngine";
