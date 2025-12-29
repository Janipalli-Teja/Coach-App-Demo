import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants/design';
import { Card } from '../common/Card';
import { SectionHeader } from '../common/SectionHeader';
import { DEFAULT_BRANCHES } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface BranchSelectViewProps {
    onBack: () => void;
    onBranchSelect: (branch: string) => void;
    branches?: string[];
}

export const BranchSelectView = ({ onBack, onBranchSelect, branches }: BranchSelectViewProps) => {
    const { theme, mode } = useTheme();

    const displayBranches = branches || DEFAULT_BRANCHES || [];

    return (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <SectionHeader title="Select Branch" onBack={onBack} />
            <View style={{ gap: 16 }}>
                {displayBranches.map((branch) => (
                    <Card
                        key={branch}
                        onPress={() => onBranchSelect(branch)}
                        style={styles.listItem}
                        backgroundColor={mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(224, 231, 255, 0.4)'}
                        variant="solid" // Use solid to control BG
                    >
                        <View style={[styles.iconBoxLarge, { backgroundColor: mode === 'dark' ? 'rgba(79, 70, 229, 0.2)' : COLORS.indigo50 }]}>
                            <Feather name="map-pin" size={24} color={mode === 'dark' ? COLORS.indigo400 : COLORS.indigo600} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.listTitle, { color: theme.text }]}>{branch}</Text>
                            <Text style={[styles.listSubtitle, { color: theme.textSecondary }]}>Sports Complex</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={mode === 'dark' ? 'rgba(255,255,255,0.3)' : COLORS.slate300} />
                    </Card>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 0,
        borderWidth: 0,
    },
    iconBoxLarge: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    listSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
});
