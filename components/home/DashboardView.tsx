import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants/design';
import { Card } from '../common/Card';
import { User, Student } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

export type DashboardMode = 'students' | 'attendance' | 'fees' | 'analytics';

interface DashboardViewProps {
    userProfile: User | null;
    students: Student[];
    selectedBranch?: string;
    allStudentsCount?: number;
    loading?: boolean;
    onModeSelect: (mode: DashboardMode) => void;
    onViewBranchAnalytics?: () => void;
}

export const DashboardView = ({
    userProfile,
    students,
    selectedBranch,
    allStudentsCount,
    loading,
    onModeSelect,
    onViewBranchAnalytics
}: DashboardViewProps) => {
    const { theme, mode } = useTheme();
    const styles = React.useMemo(() => createStyles(theme, mode), [theme, mode]);

    const studentCount = selectedBranch === 'Together' && allStudentsCount !== undefined
        ? allStudentsCount
        : students.length;

    return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.headerContainer}>
                <View>
                    <Text style={[styles.greeting, { color: theme.textSecondary }]}>Welcome back,</Text>
                    <Text style={[styles.userName, { color: theme.text }]}>
                        {userProfile?.name?.split(' ')[0] || 'Coach'}!
                    </Text>
                </View>
                <TouchableOpacity style={styles.profileCircle}>
                    {userProfile?.profileUrl ? (
                        <Image source={{ uri: userProfile.profileUrl }} style={styles.headerAvatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primaryLight }]}>
                            <Text style={[styles.avatarInitial, { color: theme.primary }]}>{userProfile?.name?.[0] || 'C'}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Hero Summary Card */}
            <Card style={styles.heroCard} contentStyle={styles.heroCardContent}>
                <View style={styles.heroContent}>
                    <View style={[styles.heroIconBox, { backgroundColor: theme.primary + '12' }]}>
                        <Feather name="activity" size={28} color={theme.primary} />
                    </View>
                    <View style={styles.heroMain}>
                        <Text style={[styles.heroLabel, { color: theme.textSecondary }]}>Active Students</Text>
                        <Text style={[styles.heroValue, { color: theme.text }]}>{loading ? '...' : (allStudentsCount || 0)}</Text>
                    </View>
                </View>

                <View style={styles.heroFooter}>
                    <View style={styles.trendInfo}>
                        <Feather name="trending-up" size={14} color={theme.success} />
                        <Text style={[styles.trendText, { color: theme.success }]}>Growth Tracked</Text>
                    </View>
                    <View style={styles.heroDivider} />
                    <TouchableOpacity onPress={onViewBranchAnalytics || (() => onModeSelect('analytics'))} style={styles.analyticsBtn}>
                        <Text style={[styles.analyticsText, { color: theme.primary }]}>View Analytics</Text>
                        <Feather name="chevron-right" size={14} color={theme.primary} />
                    </TouchableOpacity>
                </View>
            </Card>

            <View style={styles.sectionHeaderLine}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Management Hub</Text>
            </View>

            <View style={styles.grid}>
                {/* Students Card */}
                <Card
                    onPress={() => onModeSelect('students')}
                    style={styles.gridCard}
                    contentStyle={styles.gridCardContent}
                >
                    <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                        <Feather name="users" size={24} color={theme.primary} />
                    </View>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Students</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Directory</Text>
                </Card>

                {/* Attendance Card */}
                <Card
                    onPress={() => onModeSelect('attendance')}
                    style={styles.gridCard}
                    contentStyle={styles.gridCardContent}
                >
                    <View style={[styles.iconBox, { backgroundColor: theme.success + '15' }]}>
                        <Feather name="calendar" size={24} color={theme.success} />
                    </View>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Attendance</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Daily Logs</Text>
                </Card>
            </View>

            <View style={[styles.grid, { marginTop: 16 }]}>
                {/* Fees Card */}
                <Card
                    onPress={() => onModeSelect('fees')}
                    style={styles.gridCard}
                    contentStyle={styles.gridCardContent}
                >
                    <View style={[styles.iconBox, { backgroundColor: theme.warning + '15' }]}>
                        <Feather name="credit-card" size={24} color={theme.warning} />
                    </View>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Fees</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Invoices</Text>
                </Card>

                {/* Analytics Card */}
                <Card
                    onPress={() => onModeSelect('analytics')}
                    style={styles.gridCard}
                    contentStyle={styles.gridCardContent}
                >
                    <View style={[styles.iconBox, { backgroundColor: COLORS.violet600 + '15' }]}>
                        <Feather name="bar-chart-2" size={24} color={COLORS.violet600} />
                    </View>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Analytics</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Insights</Text>
                </Card>
            </View>
        </ScrollView>
    );
};

const createStyles = (theme: any, mode: string) => StyleSheet.create({
    scrollContent: {
        padding: 24,
        paddingBottom: 100,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    greeting: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    userName: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -0.8,
    },
    profileCircle: {
        width: 54,
        height: 54,
        borderRadius: 20,
        overflow: 'hidden',
    },
    headerAvatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 22,
        fontWeight: '800',
    },
    heroCard: {
        marginBottom: 32,
    },
    heroCardContent: {
        padding: 24,
    },
    heroContent: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        paddingVertical: 10,
    },
    heroMain: {
        alignItems: 'center',
    },
    heroLabel: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    heroValue: {
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: -2,
    },
    heroIconBox: {
        width: 64,
        height: 64,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        gap: 20,
    },
    heroDivider: {
        width: 1,
        height: 14,
        backgroundColor: theme.border,
    },
    trendInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    trendText: {
        fontSize: 12,
        fontWeight: '700',
    },
    analyticsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    analyticsText: {
        fontSize: 12,
        fontWeight: '700',
    },
    sectionHeaderLine: {
        marginBottom: 20,
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    grid: {
        flexDirection: 'row',
        gap: 16,
    },
    gridCard: {
        flex: 1,
        height: 175,
    },
    gridCardContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 24,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 4,
        textAlign: 'center',
    },
    cardSubtitle: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
});
