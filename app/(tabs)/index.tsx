import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, BackHandler, Dimensions, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getStudents, getStudentsByBranch, getAllStudents, deleteStudent, saveAttendance, saveFeePayments } from '../../services/studentService';
import { Student, Branch, Session, DEFAULT_BRANCHES, DEFAULT_SESSIONS } from '../../types';
import { auth } from '../../services/firebase';
import { getBranches, getSessions, initializeDefaultData } from '../../services/academyService';
import { COLORS } from '../../constants/design';

import { DashboardView, DashboardMode } from '../../components/home/DashboardView';
import { BranchSelectView } from '../../components/home/BranchSelectView';
import { SessionSelectView } from '../../components/home/SessionSelectView';
import { StudentListView } from '../../components/home/StudentListView';
import { StudentDetailView } from '../../components/home/StudentDetailView';
import { AnalyticsView } from '../../components/home/AnalyticsView';

import { AddStudentView } from '../../components/home/AddStudentView';
import { BranchTabs } from '../../components/home/BranchTabs';
import { CustomAlert } from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { getFriendlyErrorMessage } from '../../services/errorService';

type ViewState = 'dashboard' | 'session_select' | 'list' | 'detail' | 'add_student' | 'edit_student' | 'analytics' | 'branch_analytics';

export default function HomeScreen() {
  const { userProfile } = useAuth();
  const { theme, mode: themeMode, toggleTheme } = useTheme();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  const navigation = useNavigation();

  const [view, setView] = useState<ViewState>('dashboard');
  const [mode, setMode] = useState<DashboardMode>('students');
  const [selectedBranch, setSelectedBranch] = useState<string>(DEFAULT_BRANCHES[0]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]); // This will be the sliced list for UI
  const [currentStudentsCount, setCurrentStudentsCount] = useState<number>(0); // Actual total for context
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const [dynamicBranches, setDynamicBranches] = useState<string[]>([]);
  const [dynamicSessions, setDynamicSessions] = useState<Session[]>([]);

  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);

  // Refresh dashboard data when screen comes into focus or view/branch changes
  useFocusEffect(
    React.useCallback(() => {
      loadAcademySettings().then(() => {
        if (view === 'dashboard') {
          fetchDashboardStudents();
        }
      });
    }, [view, selectedBranch])
  );

  // Reset view to dashboard when Home tab icon is pressed
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, () => {
      setView('dashboard');
      setSelectedStudent(null);
      setSelectedSession(null);
    });
    return unsubscribe;
  }, [navigation]);

  // Handle Android hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (view === 'dashboard') {
          return false; // Allow default behavior (exit app)
        }

        if (view === 'detail' || view === 'add_student' || view === 'edit_student') {
          setView(selectedSession ? 'list' : 'dashboard');
          return true;
        }

        if (view === 'list' || view === 'analytics') {
          setView('session_select');
          return true;
        }

        if (view === 'branch_analytics') {
          setView('dashboard');
          return true;
        }

        if (view === 'session_select') {
          setView('dashboard');
          return true;
        }

        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [view, selectedSession])
  );

  const loadAcademySettings = async () => {
    try {
      // Removed automatic seeding on reload to respect manual data management
      // await initializeDefaultData();
      const bData = await getBranches();
      const sData = await getSessions();

      setAllBranches(bData);
      setAllSessions(sData);

      const bNames = bData.length > 0 ? bData.map(b => b.name) : [...DEFAULT_BRANCHES];
      setDynamicBranches(bNames);

      // Adjust selectedBranch if it's not in the new list and not 'Together'
      if (selectedBranch !== 'Together' && !bNames.includes(selectedBranch)) {
        const nextBranch = bNames[0];
        setSelectedBranch(nextBranch);
      }
    } catch (e) {
      console.error("Error loading academy settings:", e);
      setDynamicBranches([...DEFAULT_BRANCHES]);
      setDynamicSessions([]); // Better to show nothing than wrong types
    }
  };

  // Update filtered sessions whenever selectedBranch or allSessions changes
  React.useEffect(() => {
    if (selectedBranch === 'Together') {
      // For together, we might want all unique names or just all sessions
      setDynamicSessions(allSessions);
    } else {
      const branchObj = allBranches.find(b => b.name === selectedBranch);
      if (branchObj) {
        const filtered = allSessions.filter(s => s.branchId === branchObj.id);
        setDynamicSessions(filtered);
      } else {
        setDynamicSessions([]);
      }
    }
  }, [selectedBranch, allBranches, allSessions]);


  const fetchDashboardStudents = async () => {
    setLoading(true);
    try {
      let all: Student[] = [];
      if (selectedBranch === 'Together') {
        all = await getAllStudents();
      } else {
        all = await getStudentsByBranch(selectedBranch);
      }

      // 1. Set the actual total count (NOT sliced)
      setCurrentStudentsCount(all.length);

      // 2. Sort and slice for the "Recent Students" or Dashboard list
      all.sort((a, b) => b.fullName.localeCompare(a.fullName));
      setStudents(all.slice(0, 10));
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Logic for list and analytics view
  React.useEffect(() => {
    if ((view === 'list' || view === 'analytics') && selectedSession) {
      fetchStudents();
    }
  }, [view, selectedBranch, selectedSession]);

  const fetchStudents = async (showLoader = true) => {
    if (!selectedSession) return;
    if (showLoader) {
      setLoading(true);
      setLoadingText('Fetching students...');
    }
    try {
      let data: Student[] = [];
      if (selectedBranch === 'Together') {
        const bList = (dynamicBranches.length > 0 ? dynamicBranches : [...DEFAULT_BRANCHES])
          .filter(b => b !== 'Together');
        const promises = bList.map(b => getStudents(b, selectedSession));
        const results = await Promise.all(promises);
        data = results.flat();
      } else {
        data = await getStudents(selectedBranch, selectedSession);
      }
      setStudents(data);
    } catch (e) {
      console.error(e);
      showAlert({ type: 'error', title: 'Error', message: 'Failed to fetch students' });
    } finally {
      if (showLoader) setLoading(false);
    }
  };


  const handleModeSelect = (newMode: DashboardMode) => {
    setMode(newMode);
    setView('session_select');
  };

  const handleViewBranchAnalytics = async () => {
    setLoading(true);
    try {
      let all: Student[] = [];
      if (selectedBranch === 'Together') {
        all = await getAllStudents();
      } else {
        all = await getStudentsByBranch(selectedBranch);
      }
      setStudents(all);
      setView('branch_analytics');
    } catch (e) {
      console.error('Error fetching branch students:', e);
    } finally {
      setLoading(false);
    }
  };

  const startFlow = () => {
    setView('session_select');
  };

  const handleBack = () => {
    setSelectedSession(null);
    setView('session_select');
  };

  const handleBranchSwitch = (branch: string) => {
    setSelectedBranch(branch);
  };

  const handleSessionSelect = (session: string) => {
    setSelectedSession(session);
    if (mode === 'analytics') {
      setView('analytics');
    } else {
      setView('list');
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setView('detail');
  };

  const fetchInsights = async () => {
    setLoadingInsights(true);
    setTimeout(() => {
      setLoadingInsights(false);
      setInsights("Student is performing well. Improving in morning drills.");
    }, 1500);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    showAlert({
      title: 'Delete Student',
      message: `Are you sure you want to delete ${selectedStudent.fullName}? This action cannot be undone.`,
      type: 'warning',
      primaryButton: 'Delete',
      onPrimaryPress: async () => {
        try {
          const success = await deleteStudent(selectedStudent.id);
          if (success) {
            fetchStudents(false);
            fetchDashboardStudents();
            setView('list');
            setTimeout(() => {
              showAlert({
                title: 'Success',
                message: 'Student record removed.',
                type: 'success'
              });
            }, 100);
          } else {
            showAlert({
              title: 'Action Failed',
              message: 'We couldn\'t delete this student. Please try again.',
              type: 'error'
            });
          }
        } catch (e) {
          showAlert({
            title: 'Action Failed',
            message: getFriendlyErrorMessage(e),
            type: 'error'
          });
        }
      },
      secondaryButton: 'Cancel',
      onSecondaryPress: () => { }
    });
  };

  const handleSaveAttendance = async (updates: { studentId: string; status: 'Present' | 'Absent' }[], date: string) => {
    if (!userProfile) return;
    if (updates.length === 0) {
      Alert.alert('No Changes', 'You haven\'t marked attendance for any students.');
      return;
    }

    setLoading(true);
    setLoadingText('Saving attendance...');

    try {
      const formattedUpdates = updates.map(u => ({
        ...u,
        date: date,
        markedBy: userProfile.uid,
        markedByName: userProfile.name
      }));

      const success = await saveAttendance(formattedUpdates);

      if (success) {
        setLoadingText('Refreshing data...');
        await fetchStudents(false);
        await fetchDashboardStudents();
        setLoading(false);

        showAlert({
          type: 'success',
          title: 'Success!',
          message: `Attendance for ${date} saved successfully`,
          primaryButton: 'Done',
        });
      } else {
        throw new Error('Save failed');
      }
    } catch (e) {
      console.error('Error saving attendance:', e);
      showAlert({
        type: 'error',
        title: 'Action Failed',
        message: getFriendlyErrorMessage(e),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFeePayments = async (updates: { studentId: string; status: 'Paid' | 'Pending'; month: string; year: string; amount?: number }[], monthYear: string) => {
    if (!userProfile) return;
    if (updates.length === 0) {
      Alert.alert('No Changes', 'You haven\'t marked any fee payments.');
      return;
    }

    setLoading(true);
    setLoadingText('Saving fee records...');

    try {
      const formattedUpdates = updates.map(u => ({
        studentId: u.studentId,
        status: u.status,
        month: u.month,
        year: u.year,
        markedBy: userProfile.uid,
        markedByName: userProfile.name
      }));

      const success = await saveFeePayments(formattedUpdates);

      if (success) {
        setLoadingText('Refreshing data...');
        await fetchStudents(false);
        await fetchDashboardStudents();
        setLoading(false);

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        const [year, month] = monthYear.split('-');
        const displayLabel = `${monthNames[parseInt(month) - 1]} ${year}`;

        showAlert({
          type: 'success',
          title: 'Success!',
          message: `Fee records for ${displayLabel} saved successfully`,
          primaryButton: 'Done',
        });
      } else {
        throw new Error('Save failed');
      }
    } catch (e) {
      console.error('Error saving fee payments:', e);
      showAlert({
        type: 'error',
        title: 'Action Failed',
        message: getFriendlyErrorMessage(e),
      });
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => createStyles(theme, themeMode), [theme, themeMode]);
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {view !== 'add_student' && (
          <View style={styles.topBar}>
            <View style={styles.headerSpacer} />
            <View style={styles.headerCenter}>
              <Text style={[styles.academyName, { color: theme.text }]}>
                {userProfile?.academyName || 'ABC Badminton Academy'}
              </Text>
              <Text style={[styles.roleLabel, { color: theme.textTertiary }]}>
                {userProfile?.role?.toUpperCase() || 'COACH'}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={toggleTheme} style={[styles.iconBtn, { backgroundColor: theme.card }]}>
                <Feather name={themeMode === 'dark' ? 'sun' : 'moon'} size={18} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={[styles.iconBtn, { backgroundColor: theme.card }]}>
                <Feather name="log-out" size={18} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {view === 'dashboard' && <BranchTabs selectedBranch={selectedBranch} onSelect={handleBranchSwitch} branches={dynamicBranches} />}

        <View style={{ flex: 1 }}>
          {view === 'dashboard' && (
            <DashboardView
              userProfile={userProfile}
              students={students}
              selectedBranch={selectedBranch}
              allStudentsCount={currentStudentsCount}
              loading={loading}
              onModeSelect={handleModeSelect}
              onViewBranchAnalytics={handleViewBranchAnalytics}
            />
          )}

          {view === 'session_select' && (
            <SessionSelectView
              onBack={() => setView('dashboard')}
              onSessionSelect={handleSessionSelect}
              sessions={dynamicSessions}
            />
          )}
          {view === 'list' && (
            <StudentListView
              mode={mode}
              students={students}
              loading={loading}
              currentContext={`${selectedBranch} • ${selectedSession} Session`}
              onBack={() => setView('session_select')}
              onStudentSelect={handleStudentSelect}
              onAddStudent={() => setView('add_student')}
              onSaveAttendance={handleSaveAttendance}
              onSaveFeePayments={handleSaveFeePayments}
              loadingText={loadingText}
            />
          )}
          {view === 'analytics' && (
            <AnalyticsView
              students={students}
              currentContext={`${selectedBranch} • ${selectedSession} Session`}
              onBack={() => setView('session_select')}
              sessions={dynamicSessions}
            />
          )}
          {view === 'branch_analytics' && (
            <AnalyticsView
              students={students}
              currentContext={`${selectedBranch} Branch Overview`}
              onBack={() => setView('dashboard')}
              sessions={dynamicSessions}
            />
          )}
          {view === 'detail' && selectedStudent && (
            <StudentDetailView
              student={selectedStudent}
              insights={insights}
              loadingInsights={loadingInsights}
              onBack={() => setView('list')}
              onFetchInsights={fetchInsights}
              onEdit={() => setView('edit_student')}
              onDelete={handleDeleteStudent}
            />
          )}

          {view === 'edit_student' && selectedStudent && (
            <AddStudentView
              student={selectedStudent}
              onBack={() => setView('detail')}
              onSaveSuccess={() => {
                fetchStudents(false);
                fetchDashboardStudents();
                setView('list');
              }}
              initialBranch={selectedBranch}
              initialSession={selectedSession || selectedStudent.session}
              branches={dynamicBranches}
              sessions={dynamicSessions}
            />
          )}
          {view === 'add_student' && selectedSession && (
            <AddStudentView
              onBack={() => setView('list')}
              onSaveSuccess={() => {
                fetchStudents(false);
                fetchDashboardStudents();
                setView('list');
              }}
              initialBranch={selectedBranch}
              initialSession={selectedSession}
              branches={dynamicBranches}
              sessions={dynamicSessions}
            />
          )}
        </View>

        {/* Custom Alert */}
        {alertConfig && (
          <CustomAlert
            visible={!!alertConfig}
            type={alertConfig.type}
            title={alertConfig.title}
            message={alertConfig.message}
            primaryButton={alertConfig.primaryButton}
            secondaryButton={alertConfig.secondaryButton}
            onPrimaryPress={alertConfig.onPrimaryPress}
            onSecondaryPress={alertConfig.onSecondaryPress}
            onClose={hideAlert}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: any, mode: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 25,
  },
  headerSpacer: {
    width: 80,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
    width: 80,
    justifyContent: 'flex-end',
  },
  academyName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  iconBtn: {
    padding: 8,
  },
});
