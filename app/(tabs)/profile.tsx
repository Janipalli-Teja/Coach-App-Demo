import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator, FlatList, Platform, SectionList, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../services/firebase';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/common/Card';
import { updateUserName, updateAcademyName, getStaff, addStaff, deleteStaff, getBranches, saveBranch, deleteBranch, getSessions, saveSession, deleteSession, registerStaff, initializeDefaultData, updateUserProfileImage } from '../../services/academyService';
import { Branch, Session, User, UserRole } from '../../types';
import { COLORS } from '../../constants/design';
import { CustomAlert } from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { getFriendlyErrorMessage } from '../../services/errorService';
import { exportAcademyDataToExcel } from '../../services/exportService';
import { pickAndUploadImage } from '../../services/cloudinaryService';

interface ManagementModalProps {
    visible: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    loading?: boolean;
    theme: any;
    styles: any;
}

const ManagementModal = ({ visible, title, onClose, children, loading, theme, styles }: ManagementModalProps) => (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Feather name="x" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>
                {loading ? (
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
                ) : (
                    <View style={{ flex: 1 }}>{children}</View>
                )}
            </View>
        </View>
    </Modal>
);

export default function ProfileScreen() {
    const { userProfile, refreshProfile } = useAuth();
    const { theme, mode, setMode } = useTheme();
    const { alertConfig, showAlert, hideAlert } = useCustomAlert();
    const styles = useMemo(() => createStyles(theme, mode), [theme, mode]);

    const [loading, setLoading] = useState(false);

    // Modals
    const [editProfileModal, setEditProfileModal] = useState(false);
    const [newName, setNewName] = useState(userProfile?.name || '');
    const [newProfileUrl, setNewProfileUrl] = useState(userProfile?.profileUrl || '');

    const [editAcademyModal, setEditAcademyModal] = useState(false);
    const [newAcademyName, setNewAcademyName] = useState(userProfile?.academyName || 'ABC Badminton Academy');

    const [staffModal, setStaffModal] = useState(false);
    const [addStaffModal, setAddStaffModal] = useState(false);
    const [newStaff, setNewStaff] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Coach' as UserRole
    });

    const [branchModal, setBranchModal] = useState(false);
    const [sessionModal, setSessionModal] = useState(false);

    // Data for management
    const [staff, setStaff] = useState<User[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);

    const [addBranchModal, setAddBranchModal] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [branchForm, setBranchForm] = useState({ name: '', address: '', contactNumber: '' });

    const [addSessionModal, setAddSessionModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [sessionForm, setSessionForm] = useState({
        name: '',
        timings: '',
        fee: '',
        branchId: '',
        startTime: 1020 // Default 5:00 PM (17 * 60)
    });

    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    // Removed automatic seeding to allow full manual control over batches
    // useEffect(() => {
    //     initializeDefaultData();
    // }, []);

    useEffect(() => {
        if (staffModal) loadStaff();
    }, [staffModal]);

    useEffect(() => {
        if (branchModal) loadBranches();
    }, [branchModal]);

    useEffect(() => {
        if (sessionModal) {
            loadSessions();
            loadBranches();
        }
    }, [sessionModal]);

    const loadStaff = async () => {
        setLoading(true);
        const data = await getStaff();
        setStaff(data);
        setLoading(false);
    };

    const loadBranches = async () => {
        setLoading(true);
        const data = await getBranches();
        setBranches(data);
        setLoading(false);
    };

    const loadSessions = async () => {
        setLoading(true);
        const data = await getSessions();
        setSessions(data);
        setLoading(false);
    };

    useEffect(() => {
        if (userProfile) {
            setNewName(userProfile.name);
            setNewAcademyName(userProfile.academyName || 'ABC Badminton Academy');
        }
    }, [userProfile]);

    const handleUpdateProfile = async () => {
        if (!userProfile?.uid || !newName.trim()) return;
        setLoading(true);

        const success = await updateUserName(userProfile.uid, newName.trim());

        if (success) {
            await refreshProfile();
            setEditProfileModal(false);
            setTimeout(() => {
                showAlert({
                    type: 'success',
                    title: 'Success',
                    message: 'Profile updated successfully!',
                    primaryButton: 'Awesome'
                });
            }, 100);
        } else {
            showAlert({
                type: 'error',
                title: 'Operation Failed',
                message: 'We couldn\'t update your profile right now. Please try again soon.',
                primaryButton: 'OK'
            });
        }
        setLoading(false);
    };

    const handleProfileImageUpload = async () => {
        if (!userProfile?.uid) return;

        showAlert({
            title: 'Change Profile Picture',
            message: 'Where would you like to pick your image from?',
            type: 'info',
            primaryButton: 'Gallery',
            secondaryButton: 'Camera',
            onPrimaryPress: async () => {
                await startImageUpload('gallery');
            },
            onSecondaryPress: async () => {
                await startImageUpload('camera');
            }
        });
    };

    const startImageUpload = async (source: 'gallery' | 'camera') => {
        setLoading(true);
        try {
            const result = await pickAndUploadImage(source, 'coach_profiles');
            if (result.success && result.url) {
                const updated = await updateUserProfileImage(userProfile!.uid, result.url);
                if (updated) {
                    await refreshProfile();
                    setTimeout(() => {
                        showAlert({
                            type: 'success',
                            title: 'Updated!',
                            message: 'Your profile picture has been changed.',
                            primaryButton: 'Done'
                        });
                    }, 100);
                }
            } else if (result.error !== 'Image selection cancelled') {
                showAlert({
                    type: 'error',
                    title: 'Upload Failed',
                    message: result.error || 'Something went wrong.'
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAcademyName = async () => {
        if (!userProfile?.uid || !newAcademyName.trim()) return;
        setLoading(true);
        const success = await updateAcademyName(userProfile.uid, newAcademyName.trim());
        if (success) {
            await refreshProfile();
            setEditAcademyModal(false);
            setTimeout(() => {
                showAlert({
                    type: 'success',
                    title: 'Success',
                    message: 'Academy name updated!',
                    primaryButton: 'Great'
                });
            }, 100);
        } else {
            showAlert({
                type: 'error',
                title: 'Operation Failed',
                message: 'Something went wrong while updating academy settings. Please try again.',
                primaryButton: 'OK'
            });
        }
        setLoading(false);
    };

    const handleRegisterStaff = async () => {
        if (!newStaff.name || !newStaff.email || !newStaff.password) {
            showAlert({
                type: 'warning',
                title: 'Missing Fields',
                message: 'Please fill in all staff details.',
                primaryButton: 'OK'
            });
            return;
        }

        setLoading(true);
        const result = await registerStaff(
            newStaff.email.trim(),
            newStaff.password,
            newStaff.name.trim(),
            newStaff.role,
            userProfile?.academyName || 'ABC Badminton Academy'
        );

        if (result.success) {
            await loadStaff();
            setAddStaffModal(false);
            setNewStaff({ name: '', email: '', password: '', role: 'Coach' });
            setStaffModal(true);
            setTimeout(() => {
                showAlert({
                    type: 'success',
                    title: 'Success',
                    message: 'Staff account created!',
                    primaryButton: 'Great'
                });
            }, 100);
        } else {
            showAlert({
                type: 'error',
                title: 'Registration Failed',
                message: getFriendlyErrorMessage(result.error),
                primaryButton: 'OK'
            });
        }
        setLoading(false);
    };

    const handleDeleteStaff = async (uid: string) => {
        if (userProfile?.role === 'AssistantCoach') {
            showAlert({
                type: 'error',
                title: 'Permission Denied',
                message: 'Assistant Coaches do not have permission to delete staff members.',
                primaryButton: 'OK'
            });
            return;
        }

        showAlert({
            type: 'warning',
            title: 'Remove Staff',
            message: 'Are you sure you want to remove this staff member? This will delete their profile.',
            primaryButton: 'Remove',
            secondaryButton: 'Cancel',
            onPrimaryPress: async () => {
                setLoading(true);
                const success = await deleteStaff(uid);
                if (success) {
                    await loadStaff();
                    setTimeout(() => {
                        showAlert({ type: 'success', title: 'Removed', message: 'Staff member removed successfully.' });
                    }, 100);
                } else {
                    showAlert({ type: 'error', title: 'Oops!', message: 'We couldn\'t remove this staff member. Please try again later.' });
                }
                setLoading(false);
            }
        });
    };

    const handleSaveBranchAction = async () => {
        if (!branchForm.name.trim()) return;
        if (!selectedBranch && branches.length >= 3) {
            showAlert({
                type: 'warning',
                title: 'Limit Reached',
                message: 'You can only add up to 3 stadium branches. Please remove an existing one to add a new one.',
                primaryButton: 'OK'
            });
            return;
        }

        setLoading(true);
        const success = await saveBranch(branchForm as any, selectedBranch?.id);
        if (success) {
            await loadBranches();
            setAddBranchModal(false);
            setBranchModal(true);
            setTimeout(() => {
                showAlert({ type: 'success', title: 'Success', message: 'Branch saved successfully!' });
            }, 100);
        } else {
            showAlert({ type: 'error', title: 'Action Failed', message: 'The branch could not be saved. Please check your connection.' });
        }
        setLoading(false);
    };

    const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    const handleSaveSessionAction = async () => {
        if (!sessionForm.name.trim() || !sessionForm.fee || !sessionForm.branchId) {
            showAlert({ type: 'warning', title: 'Missing Info', message: 'Please select a branch and fill name/fee.' });
            return;
        }
        setLoading(true);
        const success = await saveSession({
            ...sessionForm,
            fee: Number(sessionForm.fee)
        } as any, selectedSession?.id);
        if (success) {
            await loadSessions();
            setAddSessionModal(false);
            setSessionModal(true);
            setTimeout(() => {
                showAlert({ type: 'success', title: 'Success', message: 'Session batch saved!' });
            }, 100);
        } else {
            showAlert({ type: 'error', title: 'Action Failed', message: 'The batch could not be saved. Please try again.' });
        }
        setLoading(false);
    };

    const handleDeleteBranch = async (id: string) => {
        if (userProfile?.role === 'AssistantCoach') {
            showAlert({
                type: 'error',
                title: 'Permission Denied',
                message: 'Assistant Coaches do not have permission to delete branches.',
                primaryButton: 'OK'
            });
            return;
        }

        showAlert({
            type: 'warning',
            title: 'Delete Branch',
            message: 'Are you sure? This will remove the branch stadium from your list.',
            primaryButton: 'Delete',
            secondaryButton: 'Cancel',
            onPrimaryPress: async () => {
                setLoading(true);
                const success = await deleteBranch(id);
                if (success) await loadBranches();
                setLoading(false);
            }
        });
    };

    const handleDeleteSession = async (id: string) => {
        if (userProfile?.role === 'AssistantCoach') {
            showAlert({
                type: 'error',
                title: 'Permission Denied',
                message: 'Assistant Coaches do not have permission to delete session batches.',
                primaryButton: 'OK'
            });
            return;
        }

        showAlert({
            type: 'warning',
            title: 'Delete Session',
            message: 'Are you sure? This session batch will be removed.',
            primaryButton: 'Delete',
            secondaryButton: 'Cancel',
            onPrimaryPress: async () => {
                setLoading(true);
                const success = await deleteSession(id);
                if (success) await loadSessions();
                setLoading(false);
            }
        });
    };

    const handleLogout = async () => {
        showAlert({
            type: 'warning',
            title: 'Sign Out',
            message: 'Are you sure you want to sign out?',
            primaryButton: 'Logout',
            secondaryButton: 'Stay',
            onPrimaryPress: async () => {
                try {
                    await auth.signOut();
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };



    const groupedSessions = useMemo(() => {
        const groups: { title: string; address?: string; data: Session[] }[] = [];
        branches.forEach(branch => {
            const branchSessions = sessions.filter(s => s.branchId === branch.id);
            if (branchSessions.length > 0) {
                groups.push({
                    title: branch.name,
                    address: branch.address,
                    data: branchSessions
                });
            }
        });

        const orphanSessions = sessions.filter(s => !s.branchId || !branches.find(b => b.id === s.branchId));
        if (orphanSessions.length > 0) {
            groups.push({
                title: 'Unassigned Batches',
                data: orphanSessions
            });
        }

        return groups;
    }, [sessions, branches]);

    const handleExport = async () => {
        setLoading(true);
        const result = await exportAcademyDataToExcel();
        setLoading(false);
        if (!result.success) {
            showAlert({
                type: 'error',
                title: 'Export Failed',
                message: result.error || 'Failed to generate report.'
            });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <SafeAreaView style={styles.safeArea} edges={['top']} >
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.brandName}>{userProfile?.academyName || 'ABC Badminton Academy'}</Text>
                                <TouchableOpacity onPress={() => setEditAcademyModal(true)}>
                                    <Feather name="edit-3" size={14} color={theme.primary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.userRole}>{userProfile?.role?.replace('_', ' ') || 'COACH'}</Text>
                        </View>
                    </View>

                    {/* Profile Banner */}
                    <Card style={styles.profileBanner} variant="solid" backgroundColor={theme.card}>
                        <View style={styles.avatar}>
                            {userProfile?.profileUrl ? (
                                <Image source={{ uri: userProfile.profileUrl }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarText}>{userProfile?.name?.[0] || 'C'}</Text>
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.profileName}>{userProfile?.name || 'Coach'}</Text>
                            <Text style={styles.profileSubtitle}>{userProfile?.email}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setEditProfileModal(true)} style={styles.editBtn}>
                            <Feather name="edit-2" size={18} color={theme.primary} />
                        </TouchableOpacity>
                    </Card>

                    {/* Account Info */}
                    <Text style={styles.sectionHeader}>Academy Settings</Text>

                    <Card style={styles.menuCard} variant="solid" backgroundColor={theme.card}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => setStaffModal(true)}>
                            <View style={styles.menuIconBox}>
                                <Feather name="users" size={20} color={theme.primary} />
                            </View>
                            <Text style={styles.menuText}>Manage Staff</Text>
                            <Feather name="chevron-right" size={20} color={theme.icon} />
                        </TouchableOpacity>
                    </Card>

                    <Card style={styles.menuCard} variant="solid" backgroundColor={theme.card}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => setBranchModal(true)}>
                            <View style={styles.menuIconBox}>
                                <Feather name="map-pin" size={20} color={theme.primary} />
                            </View>
                            <Text style={styles.menuText}>Branches (Stadiums)</Text>
                            <Feather name="chevron-right" size={20} color={theme.icon} />
                        </TouchableOpacity>
                    </Card>

                    <Card style={styles.menuCard} variant="solid" backgroundColor={theme.card}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => setSessionModal(true)}>
                            <View style={styles.menuIconBox}>
                                <Feather name="clock" size={20} color={theme.primary} />
                            </View>
                            <Text style={styles.menuText}>Session Batches</Text>
                            <Feather name="chevron-right" size={20} color={theme.icon} />
                        </TouchableOpacity>
                    </Card>

                    <Card style={styles.menuCard} variant="solid" backgroundColor={theme.card}>
                        <TouchableOpacity style={styles.menuItem} onPress={handleExport} disabled={loading}>
                            <View style={styles.menuIconBox}>
                                <Feather name="file-text" size={20} color={COLORS.emerald600} />
                            </View>
                            <Text style={styles.menuText}>Export Academy Data (Excel)</Text>
                            {loading ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                                <Feather name="download" size={20} color={theme.icon} />
                            )}
                        </TouchableOpacity>
                    </Card>

                    {/* Theme Selection */}
                    <Text style={styles.sectionHeader}>Appearance</Text>
                    <View style={styles.themeContainer}>
                        <TouchableOpacity
                            style={[styles.themeOption, mode === 'light' && styles.themeOptionActive]}
                            onPress={() => setMode('light')}
                        >
                            <Feather name="sun" size={20} color={mode === 'light' ? theme.primary : theme.textSecondary} />
                            <Text style={[styles.themeText, mode === 'light' && styles.themeTextActive]}>Light</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.themeOption, mode === 'dark' && styles.themeOptionActive]}
                            onPress={() => setMode('dark')}
                        >
                            <Feather name="moon" size={20} color={mode === 'dark' ? theme.primary : theme.textSecondary} />
                            <Text style={[styles.themeText, mode === 'dark' && styles.themeTextActive]}>Dark</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
                        <Text style={styles.signOutText}>Log Out Account</Text>
                    </TouchableOpacity>

                </ScrollView>

                {/* Edit Profile Modal */}
                <Modal visible={editProfileModal} animationType="fade" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.editNameModalContent}>
                            <Text style={styles.modalTitle}>Update Profile</Text>

                            <View style={{ alignItems: 'center', marginVertical: 20 }}>
                                <TouchableOpacity onPress={handleProfileImageUpload} style={styles.avatar}>
                                    {userProfile?.profileUrl ? (
                                        <Image source={{ uri: userProfile.profileUrl }} style={styles.avatarImage} />
                                    ) : (
                                        <Text style={styles.avatarText}>{userProfile?.name?.[0] || 'C'}</Text>
                                    )}
                                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }]}>
                                        <Feather name="camera" size={20} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleProfileImageUpload} style={{ marginTop: 8 }}>
                                    <Text style={{ color: theme.primary, fontWeight: '700' }}>Change Photo</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.inputLabel}>Display Name</Text>
                            <TextInput
                                style={styles.input}
                                value={newName}
                                onChangeText={setNewName}
                                placeholder="Enter display name"
                                placeholderTextColor={theme.textTertiary}
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity onPress={() => setEditProfileModal(false)} style={[styles.modalBtn, { backgroundColor: theme.surface }]}>
                                    <Text style={{ color: theme.text }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleUpdateProfile} style={[styles.modalBtn, { backgroundColor: theme.primary }]}>
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>Save Changes</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Edit Academy Modal */}
                <Modal visible={editAcademyModal} animationType="fade" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.editNameModalContent}>
                            <Text style={styles.modalTitle}>Update Academy Name</Text>
                            <TextInput
                                style={styles.input}
                                value={newAcademyName}
                                onChangeText={setNewAcademyName}
                                placeholder="Enter academy name"
                                placeholderTextColor={theme.textTertiary}
                            />
                            <View style={styles.modalActions}>
                                <TouchableOpacity onPress={() => setEditAcademyModal(false)} style={[styles.modalBtn, { backgroundColor: theme.surface }]}>
                                    <Text style={{ color: theme.text }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleUpdateAcademyName} style={[styles.modalBtn, { backgroundColor: theme.primary }]}>
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>Update Academy</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Management Modals */}
                <ManagementModal visible={staffModal} title="Academy Staff" onClose={() => setStaffModal(false)} theme={theme} styles={styles}>
                    <FlatList
                        data={staff}
                        keyExtractor={item => item.uid}
                        renderItem={({ item }) => (
                            <View style={styles.listItem}>
                                <View style={styles.listAvatar}>
                                    <Text style={styles.listAvatarText}>{item.name[0]}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.listTitle}>{item.name}</Text>
                                    <Text style={styles.listSubtitle}>{item.role}</Text>
                                </View>
                                {userProfile?.role !== 'AssistantCoach' && (
                                    <TouchableOpacity onPress={() => handleDeleteStaff(item.uid)}>
                                        <Feather name="trash-2" size={18} color={COLORS.red600} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                        ListEmptyComponent={<Text style={styles.emptyText}>No staff added yet.</Text>}
                    />
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => {
                            setStaffModal(false);
                            setAddStaffModal(true);
                        }}
                    >
                        <Feather name="plus" size={20} color="#fff" />
                        <Text style={styles.addBtnText}>Register New Staff</Text>
                    </TouchableOpacity>
                </ManagementModal>

                {/* Add Staff Form Modal */}
                <Modal visible={addStaffModal} animationType="none" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Register Staff</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setAddStaffModal(false);
                                        setStaffModal(true);
                                    }}
                                    style={styles.closeBtn}
                                >
                                    <Feather name="x" size={24} color={theme.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ padding: 20 }}>
                                <Text style={styles.inputLabel}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Coach Name"
                                    placeholderTextColor={theme.textTertiary}
                                    value={newStaff.name}
                                    onChangeText={(val) => setNewStaff(p => ({ ...p, name: val }))}
                                />

                                <Text style={styles.inputLabel}>Email Address</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="email@academy.com"
                                    placeholderTextColor={theme.textTertiary}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={newStaff.email}
                                    onChangeText={(val) => setNewStaff(p => ({ ...p, email: val }))}
                                />

                                <Text style={styles.inputLabel}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Temp Password (min 6 chars)"
                                    placeholderTextColor={theme.textTertiary}
                                    secureTextEntry
                                    value={newStaff.password}
                                    onChangeText={(val) => setNewStaff(p => ({ ...p, password: val }))}
                                />

                                <Text style={styles.inputLabel}>App Role</Text>
                                <View style={styles.roleOptions}>
                                    {['Coach', 'AssistantCoach'].map((r) => (
                                        <TouchableOpacity
                                            key={r}
                                            style={[styles.roleChip, newStaff.role === r && { backgroundColor: theme.primary }]}
                                            onPress={() => setNewStaff(p => ({ ...p, role: r as UserRole }))}
                                        >
                                            <Text style={[styles.roleChipText, newStaff.role === r && { color: '#fff' }]}>
                                                {r.replace('Coach', ' Coach')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={[styles.submitBtn, { backgroundColor: theme.primary, marginTop: 24 }]}
                                    onPress={handleRegisterStaff}
                                    disabled={loading}
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Account</Text>}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                <ManagementModal visible={branchModal} title="Branches" onClose={() => setBranchModal(false)} theme={theme} styles={styles}>
                    <FlatList
                        data={branches}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.listItem}>
                                <View style={[styles.listIcon, { backgroundColor: COLORS.indigo100 }]}>
                                    <Feather name="map-pin" size={16} color={COLORS.indigo600} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.listTitle}>{item.name}</Text>
                                    <Text style={styles.listSubtitle}>{item.address}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                                    <TouchableOpacity onPress={() => {
                                        setSelectedBranch(item);
                                        setBranchForm({ name: item.name, address: item.address, contactNumber: item.contactNumber });
                                        setBranchModal(false);
                                        setAddBranchModal(true);
                                    }}>
                                        <Feather name="edit-2" size={16} color={theme.textTertiary} />
                                    </TouchableOpacity>
                                    {userProfile?.role !== 'AssistantCoach' && (
                                        <TouchableOpacity onPress={() => handleDeleteBranch(item.id)}>
                                            <Feather name="trash-2" size={16} color={COLORS.red600} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={<Text style={styles.emptyText}>No branches configured.</Text>}
                    />
                    <TouchableOpacity style={styles.addBtn} onPress={() => {
                        if (branches.length >= 3) {
                            showAlert({
                                type: 'warning',
                                title: 'Limit Reached',
                                message: 'You have reached the maximum limit of 3 branches. Delete or edit an existing one.',
                                primaryButton: 'OK'
                            });
                            return;
                        }
                        setSelectedBranch(null);
                        setBranchForm({ name: '', address: '', contactNumber: '' });
                        setBranchModal(false);
                        setAddBranchModal(true);
                    }}>
                        <Feather name="plus" size={20} color="#fff" />
                        <Text style={styles.addBtnText}>Add New Branch</Text>
                    </TouchableOpacity>
                </ManagementModal>

                <ManagementModal visible={sessionModal} title="Session Batches" onClose={() => setSessionModal(false)} theme={theme} styles={styles}>
                    <SectionList
                        sections={groupedSessions}
                        keyExtractor={item => item.id}
                        renderSectionHeader={({ section: { title, address } }) => (
                            <View style={styles.sectionHeaderContainer}>
                                <View style={styles.sectionHeaderLine} />
                                <View style={styles.sectionHeaderLabel}>
                                    <Feather name="map-pin" size={12} color={theme.primary} />
                                    <Text style={styles.sectionHeaderTitle}>{title}</Text>
                                </View>
                                {address ? <Text style={styles.sectionHeaderSub} numberOfLines={1}>{address}</Text> : null}
                            </View>
                        )}
                        renderItem={({ item }) => (
                            <View style={styles.sessionCard}>
                                <View style={[styles.sessionIcon, { backgroundColor: theme.primaryLight }]}>
                                    <Feather name="clock" size={18} color={theme.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sessionName}>{item.name}</Text>
                                    <View style={styles.sessionMeta}>
                                        <Text style={styles.sessionTime}>{item.timings}</Text>
                                        <View style={styles.dotSeparator} />
                                        <Text style={styles.sessionFee}>₹{item.fee}</Text>
                                    </View>
                                </View>
                                <View style={styles.sessionActions}>
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={() => {
                                            setSelectedSession(item);
                                            setSessionForm({
                                                name: item.name,
                                                timings: item.timings,
                                                fee: item.fee.toString(),
                                                branchId: item.branchId || '',
                                                startTime: item.startTime || 1020
                                            });
                                            setSessionModal(false);
                                            setAddSessionModal(true);
                                        }}
                                    >
                                        <Feather name="edit-2" size={16} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                    {userProfile?.role !== 'AssistantCoach' && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { marginLeft: 8 }]}
                                            onPress={() => handleDeleteSession(item.id)}
                                        >
                                            <Feather name="trash-2" size={16} color={COLORS.red600} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={<Text style={styles.emptyText}>No session batches configured.</Text>}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                    <TouchableOpacity style={styles.addBtn} onPress={() => {
                        setSelectedSession(null);
                        setSessionForm({ name: '', timings: '', fee: '', branchId: branches[0]?.id || '', startTime: 1020 });
                        setSessionModal(false);
                        setAddSessionModal(true);
                    }}>
                        <Feather name="plus" size={20} color="#fff" />
                        <Text style={styles.addBtnText}>Add Batch</Text>
                    </TouchableOpacity>
                </ManagementModal>

                {/* Branch Editor Modal */}
                <Modal visible={addBranchModal} transparent={true} animationType="none">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{selectedBranch ? 'Edit Branch' : 'Add Branch'}</Text>
                                <TouchableOpacity onPress={() => { setAddBranchModal(false); setBranchModal(true); }}>
                                    <Feather name="x" size={24} color={theme.text} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={{ padding: 20 }}>
                                <Text style={styles.inputLabel}>Stadium Name</Text>
                                <TextInput style={styles.input} placeholderTextColor={theme.textTertiary} value={branchForm.name} onChangeText={t => setBranchForm(p => ({ ...p, name: t }))} />
                                <Text style={styles.inputLabel}>Address</Text>
                                <TextInput style={styles.input} placeholderTextColor={theme.textTertiary} value={branchForm.address} onChangeText={t => setBranchForm(p => ({ ...p, address: t }))} />
                                <Text style={styles.inputLabel}>Contact Number</Text>
                                <TextInput style={styles.input} placeholderTextColor={theme.textTertiary} keyboardType="phone-pad" value={branchForm.contactNumber} onChangeText={t => setBranchForm(p => ({ ...p, contactNumber: t }))} />
                                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.primary, marginTop: 24 }]} onPress={handleSaveBranchAction}>
                                    <Text style={styles.submitBtnText}>Save Branch</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Session Editor Modal */}
                <Modal visible={addSessionModal} transparent={true} animationType="none">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{selectedSession ? 'Edit Batch' : 'Add Batch'}</Text>
                                <TouchableOpacity onPress={() => { setAddSessionModal(false); setSessionModal(true); }}>
                                    <Feather name="x" size={24} color={theme.text} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={{ padding: 20 }}>
                                <Text style={styles.inputLabel}>Associate with Branch</Text>
                                <View style={styles.roleOptions}>
                                    {branches.length > 0 ? (
                                        branches.map((b) => (
                                            <TouchableOpacity
                                                key={b.id}
                                                style={[
                                                    styles.branchSelectorChip,
                                                    sessionForm.branchId === b.id && {
                                                        backgroundColor: theme.primary,
                                                        borderColor: theme.primary
                                                    }
                                                ]}
                                                onPress={() => setSessionForm(p => ({ ...p, branchId: b.id }))}
                                            >
                                                <Text style={[
                                                    styles.branchSelectorText,
                                                    sessionForm.branchId === b.id && { color: '#fff' }
                                                ]}>
                                                    {b.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.roleChip, { borderColor: COLORS.orange600, backgroundColor: COLORS.orange100 + '10' }]}
                                            onPress={() => {
                                                setAddSessionModal(false);
                                                setBranchModal(true);
                                            }}
                                        >
                                            <Text style={[styles.roleChipText, { color: COLORS.orange600 }]}>+ Add a Stadium First</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <Text style={styles.inputLabel}>Batch Name</Text>
                                <TextInput style={styles.input} placeholderTextColor={theme.textTertiary} value={sessionForm.name} onChangeText={t => setSessionForm(p => ({ ...p, name: t }))} />

                                <Text style={styles.inputLabel}>Timings</Text>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <TouchableOpacity
                                        style={[styles.input, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }]}
                                        onPress={() => setShowStartTimePicker(true)}
                                    >
                                        <Feather name="clock" size={16} color={theme.textSecondary} />
                                        <Text style={{ color: theme.text }}>{sessionForm.timings.split(' - ')[0] || 'Start'}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.input, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }]}
                                        onPress={() => setShowEndTimePicker(true)}
                                    >
                                        <Feather name="clock" size={16} color={theme.textSecondary} />
                                        <Text style={{ color: theme.text }}>{sessionForm.timings.split(' - ')[1] || 'End'}</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.inputLabel}>Monthly Fee (₹)</Text>
                                <TextInput style={styles.input} placeholderTextColor={theme.textTertiary} keyboardType="numeric" value={sessionForm.fee} onChangeText={t => setSessionForm(p => ({ ...p, fee: t }))} />

                                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.primary, marginTop: 24 }]} onPress={handleSaveSessionAction}>
                                    <Text style={styles.submitBtnText}>Save Batch</Text>
                                </TouchableOpacity>

                                {showStartTimePicker && (
                                    <DateTimePicker
                                        value={(() => {
                                            const d = new Date();
                                            d.setHours(Math.floor(sessionForm.startTime / 60), sessionForm.startTime % 60);
                                            return d;
                                        })()}
                                        mode="time"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(event: any, date?: Date) => {
                                            setShowStartTimePicker(false);
                                            if (date) {
                                                const mins = date.getHours() * 60 + date.getMinutes();
                                                const startStr = formatTime(mins);
                                                const endPart = sessionForm.timings.split(' - ')[1] || formatTime(mins + 120);
                                                setSessionForm(p => ({
                                                    ...p,
                                                    startTime: mins,
                                                    timings: `${startStr} - ${endPart}`
                                                }));
                                            }
                                        }}
                                    />
                                )}

                                {showEndTimePicker && (
                                    <DateTimePicker
                                        value={new Date()}
                                        mode="time"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(event: any, date?: Date) => {
                                            setShowEndTimePicker(false);
                                            if (date) {
                                                const mins = date.getHours() * 60 + date.getMinutes();
                                                const endStr = formatTime(mins);
                                                const startPart = sessionForm.timings.split(' - ')[0] || formatTime(600);
                                                setSessionForm(p => ({
                                                    ...p,
                                                    timings: `${startPart} - ${endStr}`
                                                }));
                                            }
                                        }}
                                    />
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

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

const createStyles = (theme: any, mode: string) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
        overflow: 'hidden',
    },
    safeArea: {
        flex: 1,
    },
    scroll: {
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    brandName: {
        fontSize: 22,
        fontWeight: '900',
        color: theme.primary,
    },
    userRole: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.textSecondary,
        textTransform: 'uppercase',
        marginTop: 2,
    },
    logoutIcon: {
        padding: 8,
    },
    profileBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 24,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileName: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.text,
    },
    profileSubtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.textSecondary,
        marginTop: 2,
    },
    editBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: theme.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '800',
        color: theme.textTertiary,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    menuCard: {
        padding: 0,
        marginBottom: 12,
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: 18,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    menuIconBox: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        backgroundColor: theme.primaryLight,
        borderRadius: 12,
    },
    menuText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: theme.text,
    },
    themeContainer: {
        flexDirection: 'row',
        marginBottom: 32,
        backgroundColor: theme.card,
        padding: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
    },
    themeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    themeOptionActive: {
        backgroundColor: theme.primaryLight,
    },
    themeText: {
        marginLeft: 8,
        fontWeight: '700',
        color: theme.textSecondary,
    },
    themeTextActive: {
        color: theme.primary,
        fontWeight: '800',
    },
    signOutBtn: {
        backgroundColor: mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
        padding: 16,
        borderRadius: 18,
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    signOutText: {
        color: COLORS.red600,
        fontSize: 16,
        fontWeight: '800',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    editNameModalContent: {
        width: '100%',
        backgroundColor: theme.card,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: theme.border,
    },
    modalContent: {
        width: '100%',
        height: '80%',
        backgroundColor: theme.card,
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: theme.border,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: theme.text,
    },
    closeBtn: {
        padding: 4,
    },
    input: {
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: theme.text,
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.surface,
        borderRadius: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.border,
    },
    listAvatar: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    listAvatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    listIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.text,
    },
    listSubtitle: {
        fontSize: 12,
        color: theme.textSecondary,
        fontWeight: '600',
        marginTop: 2,
    },
    branchSelectorChip: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.surface,
    },
    branchSelectorText: {
        fontSize: 13,
        fontWeight: '800',
        color: theme.textSecondary,
        textAlign: 'center',
    },
    addBtn: {
        flexDirection: 'row',
        backgroundColor: theme.primary,
        padding: 16,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
    },
    addBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: theme.textTertiary,
        fontSize: 14,
        fontWeight: '600',
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.text, // Brighter for better visibility
        marginBottom: 8,
        marginTop: 16,
    },
    roleOptions: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 8,
    },
    roleChip: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        alignItems: 'center',
        backgroundColor: theme.surface,
    },
    roleChipText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.textSecondary,
    },
    submitBtn: {
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
    // Session Specific Styles
    sectionHeaderContainer: {
        marginTop: 24,
        marginBottom: 16,
    },
    sectionHeaderLine: {
        height: 1,
        backgroundColor: theme.border,
        marginBottom: 12,
        borderRadius: 1,
    },
    sectionHeaderLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sectionHeaderTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionHeaderSub: {
        fontSize: 11,
        color: theme.textTertiary,
        fontWeight: '600',
        marginTop: 2,
        marginLeft: 18,
    },
    sessionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.surface,
        borderRadius: 20,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.border,
        // Premium shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: mode === 'dark' ? 0.3 : 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sessionIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    sessionName: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.text,
    },
    sessionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    sessionTime: {
        fontSize: 12,
        color: theme.textSecondary,
        fontWeight: '600',
    },
    dotSeparator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.textTertiary,
        marginHorizontal: 8,
        opacity: 0.5,
    },
    sessionFee: {
        fontSize: 13,
        color: theme.primary,
        fontWeight: '700',
    },
    sessionActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: theme.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
    },
});
