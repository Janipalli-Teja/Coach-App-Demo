import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, LayoutAnimation, Platform, UIManager } from 'react-native';
import { THEME } from '../constants/design';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';
type ThemeType = typeof THEME.light;

interface ThemeContextType {
    mode: ThemeMode;
    theme: ThemeType;
    toggleTheme: () => void;
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemColorScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>(systemColorScheme === 'dark' ? 'dark' : 'light');

    // Load saved theme
    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('theme_mode');
            if (savedTheme) {
                setModeState(savedTheme as ThemeMode);
            }
        };
        loadTheme();
    }, []);

    const animateTransition = () => {
        // Linear transition for smoother "morph" feel rather than spring which can be jumpy for colors
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    };

    const toggleTheme = () => {
        animateTransition();
        const newMode = mode === 'light' ? 'dark' : 'light';
        setModeState(newMode);
        AsyncStorage.setItem('theme_mode', newMode);
    };

    const setMode = (newMode: ThemeMode) => {
        if (newMode !== mode) {
            animateTransition();
            setModeState(newMode);
            AsyncStorage.setItem('theme_mode', newMode);
        }
    };

    const theme = THEME[mode];

    return (
        <ThemeContext.Provider value={{ mode, theme, toggleTheme, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
