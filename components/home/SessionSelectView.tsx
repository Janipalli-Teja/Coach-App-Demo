import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants/design';
import { SectionHeader } from '../common/SectionHeader';
import { Card } from '../common/Card';
import { DEFAULT_SESSIONS, Session } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';



interface SessionSelectViewProps {
    onBack: () => void;
    onSessionSelect: (session: string) => void;
    sessions?: Session[];
}

export const SessionSelectView = ({ onBack, onSessionSelect, sessions }: SessionSelectViewProps) => {
    const { theme, mode } = useTheme();

    const displaySessions = sessions || DEFAULT_SESSIONS || [];

    return (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <SectionHeader title="Select Session" onBack={onBack} />

            <View style={styles.grid}>
                {displaySessions.map((session: any) => {
                    const sessionName = typeof session === 'string' ? session : session.name;
                    const timings = typeof session === 'string' ? (session.toLowerCase().includes('morning') ? '6:00 AM - 10:00 AM' : '4:00 PM - 8:00 PM') : session.timings;

                    const isMorning = sessionName.toLowerCase().includes('morning');
                    return (
                        <Card
                            key={typeof session === 'string' ? session : session.id}
                            onPress={() => onSessionSelect(sessionName)}
                            style={styles.sessionCard}
                            contentStyle={styles.sessionCardContent}
                        >
                            <View style={[
                                styles.iconBox,
                                { backgroundColor: isMorning ? theme.warningLight : theme.primaryLight }
                            ]}>
                                <Feather
                                    name={isMorning ? "sun" : "moon"}
                                    size={28}
                                    color={isMorning ? theme.warning : theme.primary}
                                />
                            </View>

                            <View style={styles.textContainer}>
                                <Text style={[styles.title, { color: theme.text }]}>
                                    {sessionName} Batch
                                </Text>
                                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                                    {timings}
                                </Text>
                            </View>

                            <Feather name="chevron-right" size={24} color={theme.textTertiary} />
                        </Card>
                    );
                })}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        padding: 24,
    },
    grid: {
        gap: 20,
    },
    sessionCard: {
        paddingVertical: 4,
    },
    sessionCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '600',
    },
});
