export const GYM_THEME_COLORS: Record<string, string> = {
    amber: '#f59e0b',
    blue: '#3b82f6',
    emerald: '#10b981',
    rose: '#f43f5e',
    purple: '#a855f7',
    cyan: '#06b6d4',
    indigo: '#6366f1',
    orange: '#f97316',
    teal: '#14b8a6',
    lime: '#84cc16',
    red: '#dc2626',
    violet: '#8b5cf6',
    fuchsia: '#d946ef',
    pink: '#ec4899',
    slate: '#64748b'
};

const SUBJECT_COLOR_MAP: Record<string, string> = {
    math: GYM_THEME_COLORS.blue,
    physics: GYM_THEME_COLORS.cyan,
    chemistry: GYM_THEME_COLORS.amber,
    biology: GYM_THEME_COLORS.emerald,
    english: GYM_THEME_COLORS.violet,
    french: GYM_THEME_COLORS.rose,
    dutch: GYM_THEME_COLORS.pink,
    philosophy: GYM_THEME_COLORS.purple,
    economics: GYM_THEME_COLORS.emerald
};

export const getThemeColor = (colorName: string): string => {
    return GYM_THEME_COLORS[colorName] || GYM_THEME_COLORS.indigo;
};

export const getSubjectColor = (category: string): string => {
    return SUBJECT_COLOR_MAP[category] || GYM_THEME_COLORS.slate;
};

export const getNeonGlow = (colorName: string, intensity: 'low' | 'medium' | 'high' = 'medium') => {
    const hex = getThemeColor(colorName);
    const alpha = intensity === 'low' ? '10' : intensity === 'medium' ? '20' : '40';
    const blur = intensity === 'low' ? '10px' : intensity === 'medium' ? '20px' : '30px';

    // Legacy style: 0 0 10px ${hex}40, 0 0 20px ${hex}20
    if (intensity === 'medium') {
        return `0 0 10px ${hex}40, 0 0 20px ${hex}20`;
    }

    return `0 0 ${blur} ${hex}${alpha}`;
};
