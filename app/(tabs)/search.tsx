import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, BackHandler, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Student, Branch, Session } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { getAllStudents, deleteStudent } from '../../services/studentService';
import { StudentDetailView } from '../../components/home/StudentDetailView';
import { AddStudentView } from '../../components/home/AddStudentView';
import { getBranches, getSessions } from '../../services/academyService';

import { COLORS } from '../../constants/design';

export default function SearchScreen() {
    const { theme, mode } = useTheme();
    const styles = useMemo(() => createStyles(theme, mode), [theme, mode]);
    const navigation = useNavigation();

    const [query, setQuery] = useState('');
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [results, setResults] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);

    // Refresh data whenever the search screen focusing
    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                setLoading(true);
                const [studentData, branchData, sessionData] = await Promise.all([
                    getAllStudents(),
                    getBranches(),
                    getSessions()
                ]);
                setAllStudents(studentData);
                setBranches(branchData);
                setSessions(sessionData);
                setLoading(false);

                // If there's an active query, refresh the search results too
                if (query.trim()) {
                    const searchTerm = query.toLowerCase();
                    const filtered = studentData.filter((s: Student) =>
                        s.fullName.toLowerCase().includes(searchTerm) ||
                        s.phoneNumber.includes(searchTerm)
                    );
                    setResults(filtered);
                }
            };
            fetchData();
        }, [query])
    );

    // Reset view when Search tab icon is pressed
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('tabPress' as any, () => {
            setSelectedStudent(null);
            setIsEditing(false);
        });
        return unsubscribe;
    }, [navigation]);

    // Handle Android hardware back button
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (isEditing) {
                    setIsEditing(false);
                    return true;
                }
                if (selectedStudent) {
                    setSelectedStudent(null);
                    return true;
                }
                return false; // Allow default behavior (exit app)
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [isEditing, selectedStudent])
    );

    const handleSearch = (text: string) => {
        setQuery(text);
        if (text.trim().length === 0) {
            setResults([]);
            return;
        }

        const searchTerm = text.toLowerCase();
        const filtered = allStudents.filter((s: Student) =>
            s.fullName.toLowerCase().includes(searchTerm) ||
            s.phoneNumber.includes(searchTerm)
        );
        setResults(filtered);
    };

    const handleStudentDelete = async (id: string) => {
        const success = await deleteStudent(id);
        if (success) {
            setAllStudents((prev: Student[]) => prev.filter((s: Student) => s.id !== id));
            setResults((prev: Student[]) => prev.filter((s: Student) => s.id !== id));
            setSelectedStudent(null);
        }
    };

    if (selectedStudent) {
        if (isEditing) {
            return (
                <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
                    <AddStudentView
                        student={selectedStudent}
                        onBack={() => setIsEditing(false)}
                        onSaveSuccess={async () => {
                            setLoading(true);
                            const data = await getAllStudents();
                            setAllStudents(data);

                            // Re-filter results to keep searching state consistent
                            if (query.trim() !== '') {
                                const searchTerm = query.toLowerCase();
                                const filtered = data.filter((s: Student) =>
                                    s.fullName.toLowerCase().includes(searchTerm) ||
                                    s.phoneNumber.includes(searchTerm)
                                );
                                setResults(filtered);
                            }

                            const updated = data.find(s => s.id === selectedStudent.id);
                            if (updated) setSelectedStudent(updated);
                            setIsEditing(false);
                            setLoading(false);
                        }}
                        initialBranch={selectedStudent.branch}
                        initialSession={selectedStudent.session}
                        branches={branches.map(b => b.name)}
                        sessions={sessions}
                    />
                </SafeAreaView>
            );
        }

        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
                <StudentDetailView
                    student={selectedStudent}
                    insights={null}
                    loadingInsights={false}
                    onBack={() => setSelectedStudent(null)}
                    onFetchInsights={() => { }}
                    onEdit={() => setIsEditing(true)}
                    onDelete={() => handleStudentDelete(selectedStudent.id)}
                />
            </SafeAreaView>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.title}>Directory Search</Text>
                    <Text style={styles.subtitle}>Find any student across all branches</Text>
                </View>
                <View style={styles.searchContainer}>
                    <Feather name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or phone..."
                        placeholderTextColor={theme.textTertiary}
                        value={query}
                        onChangeText={handleSearch}
                        selectionColor={theme.primary}
                        autoCapitalize="none"
                    />
                </View>

                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading Students...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={query.trim() === '' ? [] : results}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => setSelectedStudent(item)}
                                style={styles.resultItem}
                            >
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {item.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </Text>
                                </View>
                                <View style={styles.studentInfo}>
                                    <Text style={styles.resultName}>{item.fullName}</Text>
                                    <View style={styles.metaRow}>
                                        <View style={styles.metaItem}>
                                            <Feather name="phone" size={10} color={theme.textTertiary} />
                                            <Text style={styles.metaText}>{item.phoneNumber}</Text>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <Feather name="map-pin" size={10} color={theme.textTertiary} />
                                            <Text style={styles.metaText}>{item.branch}</Text>
                                        </View>
                                    </View>
                                </View>
                                <Feather name="chevron-right" size={18} color={theme.border} />
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                {query.trim() === '' ? (
                                    <>
                                        <View style={styles.searchIllustration}>
                                            <Feather name="users" size={40} color={theme.primaryLight} />
                                        </View>
                                        <Text style={styles.emptyText}>Start typing to search</Text>
                                        <Text style={styles.emptySubtext}>Type a student&apos;s name or number</Text>
                                    </>
                                ) : (
                                    <>
                                        <Feather name="frown" size={50} color={theme.border} />
                                        <Text style={styles.emptyText}>No students found</Text>
                                        <Text style={styles.emptySubtext}>Try searching with a different name</Text>
                                    </>
                                )}
                            </View>
                        }
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

const createStyles = (theme: any, mode: string) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
        overflow: 'hidden',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: theme.text,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 4,
        fontWeight: '500',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        borderRadius: 20,
        marginHorizontal: 20,
        paddingHorizontal: 16,
        height: 60,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: mode === 'dark' ? 0.2 : 0.05,
        shadowRadius: 10,
        elevation: 4,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.card,
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.border,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: theme.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.primary,
    },
    studentInfo: {
        flex: 1,
    },
    resultName: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.text,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: theme.textSecondary,
        fontWeight: '500',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    searchIllustration: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyText: {
        color: theme.text,
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
    },
    emptySubtext: {
        color: theme.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    }
});
