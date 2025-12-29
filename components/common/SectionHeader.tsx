import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants/design';
import { useTheme } from '../../contexts/ThemeContext';

interface SectionHeaderProps {
    title: string;
    onBack?: () => void;
    rightAction?: {
        icon: keyof typeof Feather.glyphMap;
        onPress: () => void;
    };
}

export const SectionHeader = ({ title, onBack, rightAction }: SectionHeaderProps) => {
    const { theme, mode } = useTheme();

    return (
        <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {onBack && (
                    <TouchableOpacity
                        onPress={onBack}
                        style={[
                            styles.backButton,
                            { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' }
                        ]}
                    >
                        <Feather name="arrow-left" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                )}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
            </View>

            {rightAction && (
                <TouchableOpacity
                    onPress={rightAction.onPress}
                    style={[
                        styles.actionButton,
                        { backgroundColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : COLORS.indigo50 }
                    ]}
                >
                    <Feather name={rightAction.icon} size={20} color={theme.primary} />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
        borderRadius: 20,
    },
    actionButton: {
        padding: 8,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
});
