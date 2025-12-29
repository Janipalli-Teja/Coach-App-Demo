import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../contexts/ThemeContext';
import { SectionHeader } from '../common/SectionHeader';
import { COLORS } from '../../constants/design';
import { Session, SessionType, Student } from '../../types';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '../../services/cloudinaryService';
import { addStudent, updateStudent } from '../../services/studentService';
import { CustomAlert } from '../common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { getFriendlyErrorMessage } from '../../services/errorService';

interface AddStudentViewProps {
    onBack: () => void;
    onSaveSuccess: () => void;
    initialBranch: string;
    initialSession: string; // "Morning Session" or "Evening Session"
    student?: Student;
    branches?: string[];
    sessions?: Session[];
}

export const AddStudentView = ({ onBack, onSaveSuccess, initialBranch, initialSession, student, branches, sessions }: AddStudentViewProps) => {
    const { theme, mode } = useTheme();
    const styles = useMemo(() => createStyles(theme, mode), [theme, mode]);
    const { alertConfig, showAlert, hideAlert } = useCustomAlert();

    const activeSession = useMemo(() => {
        return sessions?.find(s => s.name === initialSession);
    }, [sessions, initialSession]);

    const sessionType: SessionType = initialSession.includes('Morning') ? 'Morning' : 'Evening';
    const branchName = initialBranch === 'Together' ? (branches?.[0] || 'Epic Badminton Stadium') : initialBranch;

    const [form, setForm] = useState({
        fullName: student?.fullName || '',
        phoneNumber: student?.phoneNumber || '',
        address: student?.address || '',
        sessionTimings: student?.sessionTimings || activeSession?.timings || (sessionType === 'Morning' ? '6:00 AM - 8:00 AM' : '4:00 PM - 6:00 PM'),
        sessionFee: student?.sessionFee?.toString() || activeSession?.fee?.toString() || '',
        joiningDate: student?.joiningDate || new Date().toISOString().split('T')[0],
    });

    // Sync timings and fee if they arrive late (only for new students)
    useEffect(() => {
        if (!student && activeSession) {
            setForm(prev => {
                const morningDefault = '6:00 AM - 8:00 AM';
                const eveningDefault = '4:00 PM - 6:00 PM';
                const isUsingDefault = prev.sessionTimings === morningDefault || prev.sessionTimings === eveningDefault;

                if (isUsingDefault || !prev.sessionTimings) {
                    return {
                        ...prev,
                        sessionTimings: activeSession.timings,
                        sessionFee: activeSession.fee?.toString(),
                    };
                }
                return prev;
            });
        }
    }, [activeSession, student]);

    const [aadhaarFront, setAadhaarFront] = useState<string | null>(student?.aadhaarFrontUrl || null);
    const [aadhaarBack, setAadhaarBack] = useState<string | null>(student?.aadhaarBackUrl || null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showDatePicker, setShowDatePicker] = useState(false);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Name Validation
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!form.fullName.trim()) newErrors.fullName = 'Full Name is required';
        else if (form.fullName.trim().length < 3) newErrors.fullName = 'Name must be at least 3 characters';
        else if (!nameRegex.test(form.fullName.trim())) newErrors.fullName = 'Name should only contain letters';

        // Phone Validation
        const phoneRegex = /^[0-9]{10}$/;
        if (!form.phoneNumber.trim()) newErrors.phoneNumber = 'Phone Number is required';
        else if (form.phoneNumber.trim().length !== 10) newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
        else if (!phoneRegex.test(form.phoneNumber.trim())) newErrors.phoneNumber = 'Enter a valid 10-digit number';

        // Fee Validation
        if (!form.sessionFee.trim()) newErrors.sessionFee = 'Monthly Fee is required';
        else if (isNaN(Number(form.sessionFee)) || Number(form.sessionFee) <= 0) newErrors.sessionFee = 'Enter a valid positive amount';

        // Address Validation
        if (!form.address.trim()) newErrors.address = 'Address is required';
        else if (form.address.trim().length < 5) newErrors.address = 'Please enter a complete address';

        // Session Timings
        if (!form.sessionTimings.trim()) newErrors.sessionTimings = 'Session timings are required';

        // Date Validation
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!form.joiningDate.trim()) newErrors.joiningDate = 'Joining Date is required';
        else if (!dateRegex.test(form.joiningDate)) newErrors.joiningDate = 'Use YYYY-MM-DD format';

        // Documents
        if (!aadhaarFront) newErrors.aadhaarFront = 'Front image required';
        if (!aadhaarBack) newErrors.aadhaarBack = 'Back image required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePickImage = async (type: 'front' | 'back') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            if (type === 'front') {
                setAadhaarFront(result.assets[0].uri);
                setErrors(prev => ({ ...prev, aadhaarFront: '' }));
            } else {
                setAadhaarBack(result.assets[0].uri);
                setErrors(prev => ({ ...prev, aadhaarBack: '' }));
            }
        }
    };

    const handleSave = async () => {
        if (!validateForm()) {
            showAlert({
                type: 'warning',
                title: 'Form Error',
                message: 'Please correct the errors in the form before saving.',
            });
            return;
        }

        setLoading(true);
        try {
            let frontUrl = aadhaarFront;
            let backUrl = aadhaarBack;

            // Only upload if it's a local uri (starts with file:// or similar, and not http)
            const isLocal = (uri: string) => uri.includes('/') && !uri.startsWith('http');

            if (aadhaarFront && isLocal(aadhaarFront)) {
                const res = await uploadImageToCloudinary(aadhaarFront, 'students/aadhaar_front');
                if (res.success && res.url) frontUrl = res.url;
                else throw new Error('Aadhaar Front upload failed');
            }

            if (aadhaarBack && isLocal(aadhaarBack)) {
                const res = await uploadImageToCloudinary(aadhaarBack, 'students/aadhaar_back');
                if (res.success && res.url) backUrl = res.url;
                else throw new Error('Aadhaar Back upload failed');
            }

            const studentData = {
                fullName: form.fullName,
                phoneNumber: form.phoneNumber,
                address: form.address,
                aadhaarFrontUrl: frontUrl!,
                aadhaarBackUrl: backUrl!,
                branch: student?.branch || branchName,
                session: student?.session || initialSession,
                sessionTimings: form.sessionTimings,
                sessionFee: Number(form.sessionFee),
                joiningDate: form.joiningDate,
                // Only for new students
                ...(student ? {} : {
                    attendanceHistory: [],
                    feeHistory: [],
                    academyName: 'ABC Badminton Academy' // Safe default to ensure multi-tenant readiness
                })
            };

            if (student) {
                const success = await updateStudent(student.id, studentData);
                if (success) {
                    showAlert({
                        type: 'success',
                        title: 'Success!',
                        message: 'Student updated successfully',
                        onPrimaryPress: onSaveSuccess,
                    });
                } else throw new Error('Failed to update student');
            } else {
                const id = await addStudent(studentData as any);
                if (id) {
                    showAlert({
                        type: 'success',
                        title: 'Success!',
                        message: 'Student added successfully',
                        onPrimaryPress: onSaveSuccess,
                    });
                } else throw new Error('Failed to create student document');
            }
        } catch (error) {
            showAlert({
                type: 'error',
                title: 'Action Failed',
                message: getFriendlyErrorMessage(error),
            });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerPadding}>
                <SectionHeader title={student ? "Edit Student" : "Add New Student"} onBack={onBack} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.imageSection}>
                    <Text style={styles.sectionLabel}>Aadhaar Card Details</Text>
                    <View style={styles.aadhaarRow}>
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity
                                onPress={() => handlePickImage('front')}
                                style={[styles.aadhaarBox, errors.aadhaarFront && styles.inputErrorBorder]}
                            >
                                {aadhaarFront ? (
                                    <Image source={{ uri: aadhaarFront }} style={styles.uploadedImage} />
                                ) : (
                                    <View style={styles.placeholderImage}>
                                        <Feather name="image" size={24} color={theme.textTertiary} />
                                        <Text style={styles.uploadText}>Front Side</Text>
                                    </View>
                                )}
                                {aadhaarFront && (
                                    <View style={styles.editBadge}>
                                        <Feather name="edit-2" size={12} color="#fff" />
                                    </View>
                                )}
                            </TouchableOpacity>
                            {errors.aadhaarFront && <Text style={styles.errorTextSmall}>{errors.aadhaarFront}</Text>}
                        </View>

                        <View style={{ flex: 1 }}>
                            <TouchableOpacity
                                onPress={() => handlePickImage('back')}
                                style={[styles.aadhaarBox, errors.aadhaarBack && styles.inputErrorBorder]}
                            >
                                {aadhaarBack ? (
                                    <Image source={{ uri: aadhaarBack }} style={styles.uploadedImage} />
                                ) : (
                                    <View style={styles.placeholderImage}>
                                        <Feather name="image" size={24} color={theme.textTertiary} />
                                        <Text style={styles.uploadText}>Back Side</Text>
                                    </View>
                                )}
                                {aadhaarBack && (
                                    <View style={styles.editBadge}>
                                        <Feather name="edit-2" size={12} color="#fff" />
                                    </View>
                                )}
                            </TouchableOpacity>
                            {errors.aadhaarBack && <Text style={styles.errorTextSmall}>{errors.aadhaarBack}</Text>}
                        </View>
                    </View>
                </View>

                {/* Initial Context Info (Read Only) */}
                <View style={styles.contextBox}>
                    <View style={styles.contextRow}>
                        <Feather name="map-pin" size={14} color={theme.primary} />
                        <Text style={styles.contextText}>{branchName}</Text>
                    </View>
                    <View style={styles.contextRow}>
                        <Feather name="clock" size={14} color={theme.primary} />
                        <Text style={styles.contextText}>{activeSession?.name || initialSession} Batch</Text>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={[styles.input, errors.fullName && styles.inputErrorBorder]}
                        value={form.fullName}
                        onChangeText={t => {
                            setForm(prev => ({ ...prev, fullName: t }));
                            if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                        }}
                        placeholder="e.g. Rahul Kumar"
                        placeholderTextColor={theme.textTertiary}
                    />
                    {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={[styles.input, errors.phoneNumber && styles.inputErrorBorder]}
                            value={form.phoneNumber}
                            onChangeText={t => {
                                // Only allow numbers
                                const numericValue = t.replace(/[^0-9]/g, '');
                                setForm(prev => ({ ...prev, phoneNumber: numericValue }));
                                if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: '' }));
                            }}
                            placeholder="9876543210"
                            placeholderTextColor={theme.textTertiary}
                            keyboardType="phone-pad"
                            maxLength={10}
                        />
                        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
                    </View>

                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Monthly Fee (₹)</Text>
                        <TextInput
                            style={[styles.input, errors.sessionFee && styles.inputErrorBorder]}
                            value={form.sessionFee}
                            onChangeText={t => {
                                setForm(prev => ({ ...prev, sessionFee: t }));
                                if (errors.sessionFee) setErrors(prev => ({ ...prev, sessionFee: '' }));
                            }}
                            placeholder="1500"
                            placeholderTextColor={theme.textTertiary}
                            keyboardType="numeric"
                        />
                        {errors.sessionFee && <Text style={styles.errorText}>{errors.sessionFee}</Text>}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Address</Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }, errors.address && styles.inputErrorBorder]}
                        value={form.address}
                        onChangeText={t => {
                            setForm(prev => ({ ...prev, address: t }));
                            if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                        }}
                        placeholder="Enter full address"
                        placeholderTextColor={theme.textTertiary}
                        multiline
                    />
                    {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Session Timings</Text>
                    <TextInput
                        style={[styles.input, errors.sessionTimings && styles.inputErrorBorder]}
                        value={form.sessionTimings}
                        onChangeText={t => {
                            setForm(prev => ({ ...prev, sessionTimings: t }));
                            if (errors.sessionTimings) setErrors(prev => ({ ...prev, sessionTimings: '' }));
                        }}
                        placeholder="e.g. 6:00 AM - 8:00 AM"
                        placeholderTextColor={theme.textTertiary}
                    />
                    {errors.sessionTimings && <Text style={styles.errorText}>{errors.sessionTimings}</Text>}
                </View>


                <View style={styles.formGroup}>
                    <Text style={styles.label}>Joining Date</Text>
                    <TouchableOpacity
                        style={[styles.dateButton, errors.joiningDate && styles.inputErrorBorder]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Feather name="calendar" size={20} color={theme.textSecondary} />
                        <Text style={[styles.dateText, { color: theme.text }]}>
                            {form.joiningDate || 'Select Date'}
                        </Text>
                        <Feather name="chevron-down" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                    {errors.joiningDate && <Text style={styles.errorText}>{errors.joiningDate}</Text>}
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>{student ? 'Update Student' : 'Save Student'}</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>

            {/* Date Picker Modal */}
            {showDatePicker && (
                <DateTimePicker
                    value={form.joiningDate ? new Date(form.joiningDate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                            const formattedDate = selectedDate.toISOString().split('T')[0];
                            setForm(prev => ({ ...prev, joiningDate: formattedDate }));
                            if (errors.joiningDate) setErrors(prev => ({ ...prev, joiningDate: '' }));
                        }
                    }}
                />
            )}

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
        </View>
    );
};

const createStyles = (theme: any, mode: string) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    headerPadding: {
        paddingHorizontal: 24,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 50,
    },
    imageSection: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 16,
    },
    aadhaarRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    aadhaarBox: {
        flex: 1,
        aspectRatio: 1.5,
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    editBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 6,
        borderRadius: 12,
    },
    // Keep existing styles for compatibility during swap
    imageUploadBox: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        alignItems: 'center',
    },
    uploadText: {
        fontSize: 10,
        color: theme.textTertiary,
        marginTop: 4,
    },
    contextBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.1)' : COLORS.indigo50,
        padding: 12,
        borderRadius: 12,
        marginBottom: 24,
    },
    contextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contextText: {
        color: theme.primary,
        fontWeight: '600',
        fontSize: 13,
    },
    formGroup: {
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.textSecondary,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 16,
        color: theme.text,
        borderWidth: 1,
        borderColor: theme.border,
        fontSize: 15,
    },
    dateButton: {
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    saveBtn: {
        backgroundColor: theme.primary,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    inputErrorBorder: {
        borderColor: COLORS.red600,
        borderStyle: 'solid',
    },
    errorText: {
        color: COLORS.red600,
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
        marginLeft: 4,
    },
    errorTextSmall: {
        color: COLORS.red600,
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center',
    },
});
