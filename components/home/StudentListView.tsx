import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants/design';
import { SectionHeader } from '../common/SectionHeader';
import { Student } from '../../types';
import { Card } from '../common/Card';
import { DashboardMode } from './DashboardView';
import { useTheme } from '../../contexts/ThemeContext';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { exportContextRecords } from '../../services/exportService';


interface StudentListViewProps {
    mode: DashboardMode;
    students: Student[];
    loading: boolean;
    currentContext?: string;
    onBack: () => void;
    onStudentSelect: (student: Student) => void;
    onSaveAttendance: (updates: any[], date: string) => void;
    onSaveFeePayments: (updates: any[], month: string) => void;
    onAddStudent: () => void;
    loadingText?: string;
}

export const StudentListView = ({ mode, students, loading, currentContext, onBack, onStudentSelect, onSaveAttendance, onSaveFeePayments, onAddStudent, loadingText }: StudentListViewProps) => {
    const { theme, mode: themeMode } = useTheme();

    const getTodayStr = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getCurrentMonthStr = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    const getMonthYearDisplay = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    // Attendance States
    const [selectedDate, setSelectedDate] = useState(getTodayStr());
    const [attendance, setAttendance] = useState<Record<string, 'Present' | 'Absent'>>({});
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Fee Payment States
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr());
    const [feePayments, setFeePayments] = useState<Record<string, 'Paid' | 'Pending'>>({});
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleExportContext = async () => {
        if (mode !== 'attendance' && mode !== 'fees' && mode !== 'students') return;

        setIsExporting(true);
        const dateOrMonth = mode === 'attendance' ? selectedDate : (mode === 'fees' ? selectedMonth : '');
        const result = await exportContextRecords(mode, currentContext || 'Batch', dateOrMonth, students);
        setIsExporting(false);

        if (!result.success) {
            Alert.alert('Export Failed', result.error || 'Could not generate report');
        }
    };

    // Sync local attendance state when students or date changes
    React.useEffect(() => {
        if (mode === 'attendance') {
            const initialAttendance: Record<string, 'Present' | 'Absent'> = {};
            students.forEach(student => {
                const history = student.attendanceHistory || [];
                const record = history.find(h => h.date === selectedDate);
                if (record) {
                    initialAttendance[student.id] = record.status;
                }
            });
            setAttendance(initialAttendance);
        }
    }, [students, selectedDate, mode]);

    // Sync local fee payment state when students or month changes
    React.useEffect(() => {
        if (mode === 'fees') {
            const initialFeePayments: Record<string, 'Paid' | 'Pending'> = {};
            const [year, month] = selectedMonth.split('-');
            students.forEach(student => {
                const history = student.feeHistory || [];
                const record = history.find(h => h.year === year && h.month === month);
                if (record) {
                    initialFeePayments[student.id] = record.status;
                }
            });
            setFeePayments(initialFeePayments);
        }
    }, [students, selectedMonth, mode]);

    const changeDate = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        setSelectedDate(`${year}-${month}-${day}`);
    };

    const changeMonth = (months: number) => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const date = new Date(year, month - 1, 1); // Create date from year and month
        date.setMonth(date.getMonth() + months);

        const newYear = date.getFullYear();
        const newMonth = String(date.getMonth() + 1).padStart(2, '0');
        setSelectedMonth(`${newYear}-${newMonth}`);
    };

    const handleDateChange = (selectedDateObj: Date) => {
        setShowDatePicker(false);

        const year = selectedDateObj.getFullYear();
        const month = String(selectedDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDateObj.getDate()).padStart(2, '0');
        setSelectedDate(`${year}-${month}-${day}`);
    };

    const handleMonthChange = (selectedDateObj: Date) => {
        setShowMonthPicker(false);

        const year = selectedDateObj.getFullYear();
        const month = String(selectedDateObj.getMonth() + 1).padStart(2, '0');
        setSelectedMonth(`${year}-${month}`);
    };

    const handleDateCancel = () => {
        setShowDatePicker(false);
    };

    const handleMonthCancel = () => {
        setShowMonthPicker(false);
    };

    const handleMarkAttendance = (id: string, status: 'Present' | 'Absent') => {
        setAttendance(prev => {
            // If clicking the same status, toggle it off (optional, but good for UX)
            if (prev[id] === status) {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            }
            return { ...prev, [id]: status };
        });
    };

    const handleMarkFeePayment = (id: string, status: 'Paid' | 'Pending') => {
        setFeePayments(prev => {
            // If clicking the same status, toggle it off
            if (prev[id] === status) {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            }
            return { ...prev, [id]: status };
        });
    };

    const handleSave = () => {
        const updates = Object.entries(attendance).map(([studentId, status]) => ({
            studentId,
            status,
            date: selectedDate
        }));

        if (updates.length < students.length) {
            Alert.alert(
                'Incomplete Attendance',
                `You have only marked ${updates.length} out of ${students.length} students. Proceed?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Save Anyway', onPress: () => onSaveAttendance(updates, selectedDate) }
                ]
            );
        } else {
            onSaveAttendance(updates, selectedDate);
        }
    };

    const handleSaveFeePayments = () => {
        const [year, month] = selectedMonth.split('-');
        const updates = Object.entries(feePayments).map(([studentId, status]) => ({
            studentId,
            status,
            month,
            year
        }));

        if (updates.length < students.length) {
            Alert.alert(
                'Incomplete Fee Records',
                `You have only marked ${updates.length} out of ${students.length} students. Proceed?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Save Anyway', onPress: () => onSaveFeePayments(updates, selectedMonth) }
                ]
            );
        } else {
            onSaveFeePayments(updates, selectedMonth);
        }
    };

    const styles = useMemo(() => createStyles(theme, themeMode), [theme, themeMode]);

    const renderStudentCard = (student: Student, index: number) => {
        const isAttendance = mode === 'attendance';
        const isFees = mode === 'fees';
        const isList = mode === 'students';
        const currentStatus = attendance[student.id];
        const currentFeeStatus = feePayments[student.id];

        return (
            <Card
                key={student.id}
                onPress={isList ? () => onStudentSelect(student) : undefined}
                style={styles.card}
            >
                <View style={styles.cardContent}>
                    {/* Student Identity Section */}
                    <View style={styles.studentInfo}>
                        <View style={[styles.avatarContainer, { backgroundColor: theme.primaryLight }]}>
                            <Text style={[styles.avatarText, { color: theme.primary }]}>
                                {student.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </Text>
                        </View>
                        <View style={styles.nameSection}>
                            <Text style={[styles.studentName, { color: theme.text }]} numberOfLines={1}>{student.fullName}</Text>
                            <Text style={[styles.studentMeta, { color: theme.textSecondary }]} numberOfLines={1}>
                                {isFees ? `Monthly Fee: ₹${student.sessionFee}` : student.phoneNumber}
                            </Text>
                        </View>
                    </View>

                    {/* Action Section */}
                    {isAttendance ? (
                        <View style={styles.attendanceActions}>
                            <TouchableOpacity
                                onPress={() => handleMarkAttendance(student.id, 'Present')}
                                style={[
                                    styles.attendanceBtn,
                                    currentStatus === 'Present' && { backgroundColor: theme.success }
                                ]}
                            >
                                <Feather
                                    name="check"
                                    size={14}
                                    color={currentStatus === 'Present' ? '#fff' : theme.success}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleMarkAttendance(student.id, 'Absent')}
                                style={[
                                    styles.attendanceBtn,
                                    currentStatus === 'Absent' && { backgroundColor: theme.error }
                                ]}
                            >
                                <Feather
                                    name="x"
                                    size={14}
                                    color={currentStatus === 'Absent' ? '#fff' : theme.error}
                                />
                            </TouchableOpacity>
                        </View>
                    ) : isFees ? (
                        <View style={styles.attendanceActions}>
                            <TouchableOpacity
                                onPress={() => handleMarkFeePayment(student.id, 'Paid')}
                                style={[
                                    styles.attendanceBtn,
                                    currentFeeStatus === 'Paid' && { backgroundColor: theme.success }
                                ]}
                            >
                                <Feather
                                    name="dollar-sign"
                                    size={14}
                                    color={currentFeeStatus === 'Paid' ? '#fff' : theme.success}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleMarkFeePayment(student.id, 'Pending')}
                                style={[
                                    styles.attendanceBtn,
                                    currentFeeStatus === 'Pending' && { backgroundColor: theme.warning }
                                ]}
                            >
                                <Feather
                                    name="clock"
                                    size={14}
                                    color={currentFeeStatus === 'Pending' ? '#fff' : theme.warning}
                                />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.chevronContainer}>
                            <Feather name="chevron-right" size={20} color={theme.textTertiary} />
                        </View>
                    )}
                </View>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <SectionHeader
                    title={mode === 'students' ? 'Directory' : mode === 'attendance' ? 'Attendance' : 'Financials'}
                    onBack={onBack}
                    rightAction={mode === 'students' ? {
                        icon: 'user-plus',
                        onPress: onAddStudent
                    } : undefined}
                />

                <View style={styles.badgeRow}>
                    {currentContext && (
                        <View style={styles.contextBadge}>
                            <Feather name="layers" size={12} color={theme.primary} />
                            <Text style={styles.contextText} numberOfLines={1}>{currentContext}</Text>
                        </View>
                    )}
                    {mode === 'students' && (
                        <TouchableOpacity
                            onPress={handleExportContext}
                            style={[styles.printBtn, { height: 32, width: 32, marginLeft: 8 }]}
                            disabled={isExporting}
                        >
                            {isExporting ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                                <Feather name="printer" size={16} color={theme.primary} />
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {mode === 'attendance' && (
                    <View style={styles.dateSelectorRow}>
                        <View style={styles.dateSelector}>
                            <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateNavBtn}>
                                <Feather name="chevron-left" size={18} color={theme.primary} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                style={styles.dateDisplay}
                            >
                                <Feather name="calendar" size={14} color={theme.primary} style={{ marginRight: 6 }} />
                                <Text style={styles.dateText}>
                                    {selectedDate === getTodayStr() ? 'Today, ' : ''}{selectedDate}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateNavBtn}>
                                <Feather name="chevron-right" size={18} color={theme.primary} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={handleExportContext}
                            style={styles.printBtn}
                            disabled={isExporting}
                        >
                            {isExporting ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                                <Feather name="printer" size={20} color={theme.primary} />
                            )}
                        </TouchableOpacity>

                        <DateTimePickerModal
                            isVisible={showDatePicker}
                            mode="date"
                            date={new Date(selectedDate)}
                            onConfirm={handleDateChange}
                            onCancel={handleDateCancel}
                        />
                    </View>
                )}

                {mode === 'fees' && (
                    <View style={styles.dateSelectorRow}>
                        <View style={styles.dateSelector}>
                            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.dateNavBtn}>
                                <Feather name="chevron-left" size={18} color={theme.primary} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setShowMonthPicker(true)}
                                style={styles.dateDisplay}
                            >
                                <Feather name="calendar" size={14} color={theme.primary} style={{ marginRight: 6 }} />
                                <Text style={styles.dateText}>
                                    {selectedMonth === getCurrentMonthStr() ? 'This Month, ' : ''}{getMonthYearDisplay(selectedMonth)}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.dateNavBtn}>
                                <Feather name="chevron-right" size={18} color={theme.primary} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={handleExportContext}
                            style={styles.printBtn}
                            disabled={isExporting}
                        >
                            {isExporting ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                                <Feather name="printer" size={20} color={theme.primary} />
                            )}
                        </TouchableOpacity>

                        <DateTimePickerModal
                            isVisible={showMonthPicker}
                            mode="date"
                            date={new Date(selectedMonth + '-01')}
                            onConfirm={handleMonthChange}
                            onCancel={handleMonthCancel}
                        />
                    </View>
                )}
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.loadingText}>{loadingText || 'Syncing Students...'}</Text>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.statsRow}>
                            <Text style={styles.countText}>{students.length} Members</Text>
                            {mode === 'attendance' && (
                                <Text style={styles.statsText}>
                                    {Object.values(attendance).filter(v => v === 'Present').length} Present
                                </Text>
                            )}
                            {mode === 'fees' && (
                                <Text style={styles.statsText}>
                                    {Object.values(feePayments).filter(v => v === 'Paid').length} Paid
                                </Text>
                            )}
                        </View>

                        {students.length === 0 ? (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconCircle}>
                                    <Feather name="users" size={32} color={theme.textTertiary} />
                                </View>
                                <Text style={styles.emptyTitle}>No Students Found</Text>
                                <Text style={styles.emptySubtitle}>Try changing your search or adding a new student to this session.</Text>
                            </View>
                        ) : (
                            students.map(renderStudentCard)
                        )}
                    </ScrollView>

                    {mode === 'attendance' && students.length > 0 && (
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                                onPress={handleSave}
                            >
                                <View style={styles.saveBtnContent}>
                                    <Feather name="save" size={20} color="#fff" />
                                    <Text style={styles.saveBtnText}>Submit Attendance</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {mode === 'fees' && students.length > 0 && (
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: COLORS.amber600 }]}
                                onPress={handleSaveFeePayments}
                            >
                                <View style={styles.saveBtnContent}>
                                    <Feather name="dollar-sign" size={20} color="#fff" />
                                    <Text style={styles.saveBtnText}>Submit Fee Records</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </View >
    );
};

const createStyles = (theme: any, mode: string) => StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        paddingHorizontal: 24,
        marginBottom: 8,
        minHeight: 120, // Ensure enough space for stacked items
        justifyContent: 'flex-start',
        gap: 12,
    },
    contextBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.15)' : COLORS.indigo50,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginTop: -10,
        marginBottom: 16,
        gap: 6,
    },
    contextText: {
        color: theme.primary,
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    badgeRow: {
        marginBottom: 10,
    },
    dateSelectorRow: {
        flexDirection: 'row', // Added to align date selector and print button
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    dateSelector: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : COLORS.slate50,
        borderRadius: 14,
        padding: 4,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : COLORS.slate200,
    },
    printBtn: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : COLORS.slate50,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    dateNavBtn: {
        padding: 6,
    },
    dateDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(99, 102, 241, 0.08)',
    },
    dateText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.text,
    },
    scrollContent: {
        padding: 24, // Updated from 20
        paddingBottom: 120,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: theme.textSecondary,
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    countText: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statsText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.emerald600,
    },
    card: {
        backgroundColor: theme.card,
        borderRadius: 24,
        marginBottom: 12,
        padding: 4, // for small internal padding
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: mode === 'dark' ? 0.3 : 0.05,
        shadowRadius: 10,
        elevation: 2,
        overflow: 'hidden',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 16,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : COLORS.slate100,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '900',
        color: theme.primary,
    },
    nameSection: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.text,
        letterSpacing: -0.3,
    },
    studentMeta: {
        fontSize: 12,
        color: theme.textSecondary,
        marginTop: 2,
        fontWeight: '500',
    },
    attendanceActions: {
        flexDirection: 'row',
        gap: 8,
    },
    attendanceBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : COLORS.slate50,
        borderWidth: 1,
        borderColor: theme.border,
    },
    attendanceBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: theme.textSecondary,
    },
    presentActive: {
        backgroundColor: COLORS.emerald600,
        borderColor: COLORS.emerald500,
    },
    absentActive: {
        backgroundColor: COLORS.red600,
        borderColor: COLORS.red600,
    },
    paidActive: {
        backgroundColor: COLORS.emerald600,
        borderColor: COLORS.emerald500,
    },
    pendingActive: {
        backgroundColor: COLORS.amber600,
        borderColor: COLORS.amber500,
    },
    payBtn: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: COLORS.emerald600,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    payGradient: {
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    payBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 12,
    },
    chevronContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicator: {
        height: 3,
        width: '40%',
        alignSelf: 'center',
        marginBottom: 4,
        borderRadius: 2,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : COLORS.slate50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'transparent',
    },
    saveBtn: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    saveBtnContent: {
        paddingVertical: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
});
