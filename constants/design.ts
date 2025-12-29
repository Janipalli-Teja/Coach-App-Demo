export const COLORS = {
    orange50: '#fff7ed',
    orange100: '#ffedd5',
    orange600: '#ea580c',
    orange700: '#c2410c',
    indigo50: '#eef2ff',
    indigo100: '#e0e7ff',
    indigo200: '#c7d2fe',
    indigo400: '#818cf8',
    indigo500: '#6366f1',
    indigo600: '#4f46e5',
    indigo700: '#4338ca',
    indigo900: '#312e81',
    // New Electric Blue Scale for Premium Look
    electricBlue: '#0066FF',
    electricBlueDark: '#0052CC',
    electricBlueLight: '#3385FF',
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate300: '#cbd5e1',
    slate400: '#94a3b8',
    slate500: '#64748b',
    slate700: '#334155',
    slate800: '#1e293b',
    slate900: '#0f172a',
    // New Midnight Scale
    midnight950: '#020617',
    midnight900: '#0B0E14',
    midnight800: '#111827',
    emerald50: '#ecfdf5',
    emerald100: '#d1fae5',
    emerald200: '#a7f3d0',
    emerald500: '#10b981',
    emerald600: '#059669',
    emerald700: '#047857',
    emerald900: '#064e3b',
    amber50: '#fffbeb',
    amber100: '#fef3c7',
    amber200: '#fde68a',
    amber500: '#f59e0b',
    amber600: '#d97706',
    amber700: '#b45309',
    amber900: '#78350f',
    red50: '#fef2f2',
    red600: '#dc2626',
    violet500: '#8b5cf6',
    violet600: '#7c3aed',
    violet700: '#6d28d9',
    rose500: '#f43f5e',
    white: '#ffffff',
    black: '#000000',
};

export const THEME = {
    light: {
        background: '#F8FAFC', // Slate 50
        surface: COLORS.white,
        card: COLORS.white,
        text: '#0F172A', // Slate 900
        textSecondary: '#475569', // Slate 600 - Deeper for visibility
        textTertiary: '#64748B', // Slate 500 - Deeper
        border: '#E2E8F0', // Slate 200 - Clearly visible
        icon: '#64748B', // Slate 500
        primary: '#4F46E5', // Indigo 600
        primaryLight: 'rgba(79, 70, 229, 0.08)',
        success: '#059669',
        successLight: 'rgba(5, 150, 105, 0.08)',
        warning: '#D97706',
        warningLight: 'rgba(217, 119, 6, 0.08)',
        error: '#DC2626',
        errorLight: 'rgba(220, 38, 38, 0.08)',
        tabBar: COLORS.white,
        tabBarNonActive: '#94A3B8', // Slate 400
        shadow: 'rgba(0, 0, 0, 0.08)',
    },
    dark: {
        background: '#020617', // Midnight 950
        surface: '#0B0E14', // Midnight 900
        card: '#0B0E14',
        text: COLORS.white,
        textSecondary: '#94A3B8', // Slate 400
        textTertiary: '#475569', // Slate 600
        border: '#1E293B', // Slate 800
        icon: '#64748B', // Slate 500
        primary: '#6366F1', // Indigo 500
        primaryLight: 'rgba(99, 102, 241, 0.15)',
        success: '#10B981',
        successLight: 'rgba(16, 185, 129, 0.1)',
        warning: '#F59E0B',
        warningLight: 'rgba(245, 158, 11, 0.1)',
        error: '#EF4444',
        errorLight: 'rgba(239, 68, 68, 0.1)',
        tabBar: COLORS.black,
        tabBarNonActive: '#475569', // Slate 600
        shadow: 'rgba(0, 0, 0, 0.4)',
    }
};
