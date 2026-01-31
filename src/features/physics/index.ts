// Public API for physics feature
// Only export components that are intended for cross-feature use

// Hooks for cross-feature use
export {
    type PhysicsLabContextValue,
    useModuleState,
    useOptionalPhysicsLabContext,
    usePhysicsLabContext
} from "./hooks/usePhysicsLabContext";

// Gym engines for math feature
export * from "./ui/gym/engines";
export { FlashcardEngine } from "./ui/gym/engines/flashcards/FlashcardEngine";
export { ForceVectorEngine as PhysVectorEngine } from "./ui/gym/engines/ForceVectorEngine";

// Gym hooks and components
export { useGymSound } from "./ui/gym/hooks/useGymSound";

// Tutor for cross-feature use
export { TutorProvider } from "./ui/tutor/TutorContext";
export { useTutor } from "./ui/tutor/useTutor";

// Optics utilities
export { calculateRayPath } from "./ui/modules/optics/opticsRaytracer";
export { useOpticsEngine } from "./ui/modules/optics/useOpticsEngine";

// Kinematics utilities
export { useKinematicsEngine } from "./ui/modules/kinematics/useKinematicsEngine";
