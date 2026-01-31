import { BIO_ENGINES } from "@features/biology/ui/gym/engines";
import { CHEM_ENGINES } from "@features/chemistry/ui/gym/engines";
import { DUTCH_ENGINES } from "@features/dutch/ui/gym/engines";
import { ENGLISH_ENGINES } from "@features/english/ui/gym/engines";
import { FRENCH_ENGINES } from "@features/french/ui/gym/engines";
import { PHILOSOPHY_ENGINES } from "@features/philosophy/ui/gym/engines";
import { PHYSICS_ENGINES } from "@features/physics/ui/gym/engines";
import { MATH_ENGINES_MAP, createMixEngine } from "./engines";
import { GymEngine } from "./types";

export const GYM_ENGINE_REGISTRY: Record<string, GymEngine> = {
    ...MATH_ENGINES_MAP,
    ...PHYSICS_ENGINES,
    ...BIO_ENGINES,
    ...CHEM_ENGINES,
    ...DUTCH_ENGINES,
    ...ENGLISH_ENGINES,
    ...FRENCH_ENGINES,
    ...PHILOSOPHY_ENGINES,

    // Specials manually added
    "mix-math": createMixEngine("mix-math", "Math Milkshake", "Wiskunde mix", Object.values(MATH_ENGINES_MAP)),
};

/**
 * Safe getter that returns undefined if ID does not exist.
 */
export const getEngine = (id: string): GymEngine | undefined => {
    return GYM_ENGINE_REGISTRY[id];
};
