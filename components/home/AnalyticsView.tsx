import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants/design';
import { useTheme } from '../../contexts/ThemeContext';
import { SectionHeader } from '../common/SectionHeader';
import { Student, Session } from '../../types';
import { TouchableOpacity, ActivityIndicator, Alert } from 'react-native';

interface AnalyticsViewProps {
    students: Student[];
    currentContext?: string;
    onBack: () => void;
    sessions?: Session[];
}

export const AnalyticsView = ({ students, currentContext, onBack, sessions }: AnalyticsViewProps) => {
    const { theme, mode } = useTheme();


    // Calculate Analytics Data
    const stats = useMemo(() => {
        const totalStudents = students.length;
        if (totalStudents === 0) return {
            attendanceRate: 0, totalPresent: 0, totalAttendanceRecords: 0,
            currentFeeCollection: 0, paidCurrent: 0,
            lastMonthFeeCollection: 0, paidLast: 0,
            totalStudents: 0
        };

        // 1. Attendance Rate (Average of all students)
        let totalPresent = 0;
        let totalAttendanceRecords = 0;
        students.forEach(s => {
            if (s.attendanceHistory) {
                totalAttendanceRecords += s.attendanceHistory.length;
                totalPresent += s.attendanceHistory.filter(h => h.status === 'Present').length;
            }
        });
        const attendanceRate = totalAttendanceRecords > 0 ? (totalPresent / totalAttendanceRecords) * 100 : 0;

        // Date Helpers
        const now = new Date();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const currentYear = String(now.getFullYear());

        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = String(lastMonthDate.getMonth() + 1).padStart(2, '0');
        const lastYear = String(lastMonthDate.getFullYear());

        // 2. Current Month Fee Collection
        const paidCurrent = students.filter(s =>
            s.feeHistory?.some(f =>
                f.month === currentMonth &&
                f.year === currentYear &&
                f.status === 'Paid'
            )
        ).length;
        const currentFeeCollection = (paidCurrent / totalStudents) * 100;

        // 3. Last Month Fee Collection
        const paidLast = students.filter(s =>
            s.feeHistory?.some(f =>
                f.month === lastMonth &&
                f.year === lastYear &&
                f.status === 'Paid'
            )
        ).length;
        const lastMonthFeeCollection = (paidLast / totalStudents) * 100;

        return {
            attendanceRate: Math.round(attendanceRate),
            totalPresent,
            totalAttendanceRecords,
            currentFeeCollection: Math.round(currentFeeCollection),
            paidCurrent,
            lastMonthFeeCollection: Math.round(lastMonthFeeCollection),
            paidLast,
            totalStudents
        };
    }, [students]);

    const MetricCard = ({ title, value, unit, icon, colors, description, rawCount }: any) => (
        <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.metricHeader}>
                <View style={[styles.iconCircle, { backgroundColor: colors[0] }]}>
                    <Feather name={icon} size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.metricTitle, { color: theme.textSecondary }]}>{title}</Text>
                    <View style={styles.valueRow}>
                        <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
                        <Text style={[styles.metricUnit, { color: theme.textTertiary }]}>{unit}</Text>
                    </View>
                    {rawCount && (
                        <Text style={[styles.rawCount, { color: theme.textTertiary }]}>{rawCount}</Text>
                    )}
                </View>
            </View>
            <Text style={[styles.metricDesc, { color: theme.textTertiary }]}>{description}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.headerRow}>
                    <SectionHeader title="Analytics" onBack={onBack} />
                </View>

                <View style={styles.badgeRow}>
                    {currentContext && (
                        <View style={[styles.contextBadge, { backgroundColor: theme.primaryLight }]}>
                            <Feather name="layers" size={12} color={theme.primary} />
                            <Text style={[styles.contextText, { color: theme.primary }]} numberOfLines={1}>{currentContext}</Text>
                        </View>
                    )}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.summaryRow}>
                    <MetricCard
                        title="Attendance"
                        value={stats.attendanceRate}
                        unit="%"
                        icon="calendar"
                        colors={[COLORS.emerald500, COLORS.emerald600]}
                        description="Overall presence rate across all students."
                        rawCount={`${stats.totalPresent} / ${stats.totalAttendanceRecords}`}
                    />
                    <MetricCard
                        title="Fee Status"
                        value={stats.currentFeeCollection}
                        unit="%"
                        icon="credit-card"
                        colors={[COLORS.amber500, COLORS.amber600]}
                        description="Students who paid for the current month."
                        rawCount={`${stats.paidCurrent} / ${stats.totalStudents}`}
                    />
                </View>

                {/* Growth Section */}
                <View style={[styles.wideCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Member Insights</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.primary }]}>{stats.totalStudents}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Members</Text>
                        </View>
                        {(sessions || []).map((session, idx) => {
                            const name = typeof session === 'string' ? session : session.name;
                            return (
                                <React.Fragment key={typeof session === 'string' ? session : session.id}>
                                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statValue, { color: idx % 2 === 0 ? COLORS.violet600 : COLORS.rose500 }]}>
                                            {students.filter(s => s.session === name).length}
                                        </Text>
                                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{name}</Text>
                                    </View>
                                </React.Fragment>
                            );
                        })}
                    </View>
                </View>

                {/* Progress Indicators */}
                <View style={styles.progressSection}>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>Performance Overview</Text>

                    <View style={styles.progressItem}>
                        <View style={styles.progressHeader}>
                            <View>
                                <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Daily Attendance Stability</Text>
                                <Text style={[styles.progressCount, { color: theme.textTertiary }]}>{stats.totalPresent} / {stats.totalAttendanceRecords} Present</Text>
                            </View>
                            <Text style={[styles.progressPercent, { color: theme.text }]}>{stats.attendanceRate}%</Text>
                        </View>
                        <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                            <View style={[styles.progressBarFill, { width: `${stats.attendanceRate}%`, backgroundColor: COLORS.emerald500 }]} />
                        </View>
                    </View>

                    <View style={styles.progressItem}>
                        <View style={styles.progressHeader}>
                            <View>
                                <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Current Month Collection</Text>
                                <Text style={[styles.progressCount, { color: theme.textTertiary }]}>{stats.paidCurrent} / {stats.totalStudents} Paid</Text>
                            </View>
                            <Text style={[styles.progressPercent, { color: theme.text }]}>{stats.currentFeeCollection}%</Text>
                        </View>
                        <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                            <View style={[styles.progressBarFill, { width: `${stats.currentFeeCollection}%`, backgroundColor: COLORS.amber500 }]} />
                        </View>
                    </View>

                    <View style={styles.progressItem}>
                        <View style={styles.progressHeader}>
                            <View>
                                <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Last Month Collection</Text>
                                <Text style={[styles.progressCount, { color: theme.textTertiary }]}>{stats.paidLast} / {stats.totalStudents} Paid</Text>
                            </View>
                            <Text style={[styles.progressPercent, { color: theme.text }]}>{stats.lastMonthFeeCollection}%</Text>
                        </View>
                        <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                            <View style={[styles.progressBarFill, { width: `${stats.lastMonthFeeCollection}%`, backgroundColor: COLORS.indigo500 }]} />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        paddingBottom: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    printBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeRow: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginTop: -8,
        marginBottom: 8,
    },
    contextBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        // backgroundColor: 'rgba(99, 102, 241, 0.1)', // This will be themed
        borderRadius: 10,
        gap: 6,
    },
    contextText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        // color: COLORS.violet600, // This will be themed
    },
    content: {
        padding: 24,
        gap: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 12,
    },
    metricCard: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        justifyContent: 'space-between',
        minHeight: 140,
    },
    metricHeader: {
        gap: 12,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    metricTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: '800',
    },
    metricUnit: {
        fontSize: 12,
        fontWeight: '600',
    },
    rawCount: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 4,
    },
    metricDesc: {
        fontSize: 10,
        lineHeight: 14,
        marginTop: 12,
    },
    wideCard: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    divider: {
        width: 1,
        height: 30,
    },
    progressSection: {
        marginTop: 10,
    },
    progressItem: {
        marginBottom: 20,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    progressCount: {
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
    },
    progressPercent: {
        fontSize: 14,
        fontWeight: '700',
    },
    progressBarBg: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
});
