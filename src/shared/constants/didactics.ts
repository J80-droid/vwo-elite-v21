export const DEPTH_LEVELS = {
    ESPRESSO: 'espresso',
    FILTER: 'filter',
    DEEP_DIVE: 'deep-dive'
} as const;

export const SCAFFOLDING_LEVELS = {
    HIGH: 'high',
    MEDIUM: 'medium',
    NONE: 'none'
} as const;

export const LEARNING_ROLES = {
    RECEIVING: 'receiving',
    TEACHING: 'teaching',
    DEVIL: 'devil'
} as const;

export const SUBJECT_DOMAINS = {
    SCIENCE: ['Natuurkunde', 'Scheikunde', 'Biologie'],
    MATH: ['Wiskunde A', 'Wiskunde B', 'Wiskunde C'],
    LANGUAGES: ['Nederlands', 'Engels', 'Frans', 'Duits'],
    HUMANITIES: ['Filosofie', 'Geschiedenis']
} as const;

export type DepthLevel = typeof DEPTH_LEVELS[keyof typeof DEPTH_LEVELS];
export type ScaffoldingLevel = typeof SCAFFOLDING_LEVELS[keyof typeof SCAFFOLDING_LEVELS];
export type LearningRole = typeof LEARNING_ROLES[keyof typeof LEARNING_ROLES];
