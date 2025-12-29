import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../../constants/design';
import { useTheme } from '../../contexts/ThemeContext';
import { AttendanceRecord } from '../../types';

interface AttendanceHeatmapProps {
    attendanceHistory: AttendanceRecord[];
    joiningDate: string;
}

export const AttendanceHeatmap = ({ attendanceHistory, joiningDate }: AttendanceHeatmapProps) => {
    const { theme, mode } = useTheme();
    const styles = useMemo(() => createStyles(theme, mode), [theme, mode]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Generate month-based data with gaps
    const generateHeatmapData = () => {
        const today = new Date();
        const data: {
            month: string;
            days: { date: string; status: 'Present' | 'Absent' | null; dayOfWeek: number }[]
        }[] = [];

        // Helper to format date as YYYY-MM-DD without timezone issues
        const formatDate = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Get last 12 months
        for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
            const currentMonth = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
            const monthName = months[currentMonth.getMonth()];
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();

            // Get number of days in this month
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const monthDays: { date: string; status: 'Present' | 'Absent' | null; dayOfWeek: number }[] = [];

            for (let day = 1; day <= daysInMonth; day++) {
                const currentDate = new Date(year, month, day);
                const dateStr = formatDate(currentDate);
                const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

                // Get today as YYYY-MM-DD string for comparison
                const todayStr = formatDate(today);

                // Check if this date is in the future (using string comparison)
                if (dateStr > todayStr) {
                    monthDays.push({ date: dateStr, status: null, dayOfWeek });
                    continue;
                }

                // Check if this date is before joining (using string comparison)
                // Normalize joiningDate to YYYY-MM-DD format
                const joiningDateStr = joiningDate.split('T')[0];
                if (dateStr < joiningDateStr) {
                    monthDays.push({ date: dateStr, status: null, dayOfWeek });
                    continue;
                }

                // Find attendance record for this date
                // Normalize both dates to YYYY-MM-DD format for comparison
                const record = attendanceHistory.find(r => {
                    const recordDate = r.date.split('T')[0]; // Handle ISO strings with time
                    const match = recordDate === dateStr;

                    return match;
                });

                monthDays.push({
                    date: dateStr,
                    status: record ? record.status : null,
                    dayOfWeek
                });
            }

            data.push({ month: monthName, days: monthDays });
        }

        return data;
    };

    const heatmapData = generateHeatmapData();

    // Calculate stats from all days
    const allDays = heatmapData.flatMap(m => m.days);
    const activeDays = allDays.filter(d => d.status !== null).length;
    const presentDays = allDays.filter(d => d.status === 'Present').length;
    const absentDays = allDays.filter(d => d.status === 'Absent').length;
    const attendanceRate = activeDays > 0 ? Math.round((presentDays / activeDays) * 100) : 0;

    const getBoxColor = (status: 'Present' | 'Absent' | null) => {
        if (status === null) {
            return mode === 'dark' ? 'rgba(255,255,255,0.03)' : COLORS.slate100;
        }
        if (status === 'Present') {
            return COLORS.emerald500;
        }
        return COLORS.red600;
    };

    return (
        <View style={styles.container}>
            {/* Simple Stats Row */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{attendanceRate}%</Text>
                    <Text style={styles.statLabel}>Attendance</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: COLORS.emerald600 }]}>{presentDays}</Text>
                    <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: COLORS.red600 }]}>{absentDays}</Text>
                    <Text style={styles.statLabel}>Absent</Text>
                </View>
            </View>

            {/* Heatmap */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.heatmapScroll}>
                <View style={styles.heatmapWrapper}>
                    {/* Month labels */}
                    <View style={styles.monthRow}>
                        <View style={styles.dayLabelSpace} />
                        {heatmapData.map((monthData, idx) => {
                            // Calculate actual number of week columns (matching the rendering logic)
                            let numWeeks = 0;
                            let tempWeek: any[] = [];

                            monthData.days.forEach((day, dayIdx) => {
                                if (day.dayOfWeek === 0 && tempWeek.length > 0) {
                                    numWeeks++;
                                    tempWeek = [];
                                }
                                tempWeek.push(day);

                                if (dayIdx === monthData.days.length - 1) {
                                    numWeeks++;
                                }
                            });

                            // Width = (weeks × box width) + (gaps between weeks)
                            const monthWidth = (numWeeks * 12) + ((numWeeks - 1) * 3);

                            return (
                                <View
                                    key={idx}
                                    style={[
                                        styles.monthLabelWrapper,
                                        {
                                            width: monthWidth,
                                            marginRight: idx < heatmapData.length - 1 ? 6 : 0
                                        }
                                    ]}
                                >
                                    <Text style={styles.monthText}>{monthData.month}</Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* Heatmap grid */}
                    <View style={styles.heatmapContainer}>
                        {/* Day labels */}
                        <View style={styles.dayLabels}>
                            <Text style={styles.dayText}>Mon</Text>
                            <Text style={styles.dayText}>Wed</Text>
                            <Text style={styles.dayText}>Fri</Text>
                        </View>

                        {/* Months with gaps */}
                        <View style={styles.monthsContainer}>
                            {heatmapData.map((monthData, monthIndex) => (
                                <View key={monthIndex} style={styles.monthBlock}>
                                    {/* Group days by week within the month */}
                                    {(() => {
                                        const weeks: { date: string; status: 'Present' | 'Absent' | null; dayOfWeek: number }[][] = [];
                                        let currentWeek: { date: string; status: 'Present' | 'Absent' | null; dayOfWeek: number }[] = [];

                                        monthData.days.forEach((day, dayIdx) => {
                                            // Start new week on Sunday (dayOfWeek === 0)
                                            if (day.dayOfWeek === 0 && currentWeek.length > 0) {
                                                weeks.push(currentWeek);
                                                currentWeek = [];
                                            }
                                            currentWeek.push(day);

                                            // If it's the last day, push the current week
                                            if (dayIdx === monthData.days.length - 1) {
                                                weeks.push(currentWeek);
                                            }
                                        });

                                        return weeks.map((week, weekIdx) => (
                                            <View key={weekIdx} style={styles.weekColumn}>
                                                {/* Render 7 days, fill empty slots with transparent */}
                                                {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => {
                                                    const day = week.find(d => d.dayOfWeek === dayOfWeek);
                                                    return (
                                                        <View
                                                            key={dayOfWeek}
                                                            style={[
                                                                styles.dayBox,
                                                                {
                                                                    backgroundColor: day
                                                                        ? getBoxColor(day.status)
                                                                        : 'transparent'
                                                                }
                                                            ]}
                                                        />
                                                    );
                                                })}
                                            </View>
                                        ));
                                    })()}
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const createStyles = (theme: any, mode: string) => StyleSheet.create({
    container: {
        backgroundColor: theme.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.border,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : COLORS.slate50,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : COLORS.slate200,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '900',
        color: theme.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    heatmapScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    heatmapWrapper: {
        paddingVertical: 8,
        paddingRight: 20,
    },
    monthRow: {
        flexDirection: 'row',
        marginBottom: 12,
        paddingLeft: 35,
    },
    dayLabelSpace: {
        width: 35,
    },
    monthLabelWrapper: {
        paddingHorizontal: 6,
        minWidth: 60,
        alignItems: 'center',
    },
    monthText: {
        fontSize: 12,
        fontWeight: '800',
        color: theme.text,
        letterSpacing: 0.5,
    },
    heatmapContainer: {
        flexDirection: 'row',
    },
    dayLabels: {
        justifyContent: 'space-around',
        width: 35,
        paddingVertical: 2,
    },
    dayText: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.textSecondary,
        height: 28,
        lineHeight: 28,
    },
    monthsContainer: {
        flexDirection: 'row',
        gap: 6,
    },
    monthBlock: {
        flexDirection: 'row',
    },
    weeksContainer: {
        flexDirection: 'row',
    },
    weekColumn: {
        marginRight: 3,
    },
    dayBox: {
        width: 12,
        height: 12,
        borderRadius: 3,
        marginBottom: 3,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 12,
        justifyContent: 'flex-end',
    },
    legendText: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.textTertiary,
        marginHorizontal: 2,
    },
    legendBox: {
        width: 9,
        height: 9,
        borderRadius: 2,
    },
});
