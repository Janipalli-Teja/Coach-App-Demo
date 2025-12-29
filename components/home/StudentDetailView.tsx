import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Modal, Linking, Alert, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants/design';
import { Student } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { AttendanceHeatmap } from './AttendanceHeatmap';

const { width } = Dimensions.get('window');

interface StudentDetailViewProps {
    student: Student;
    insights: string | null;
    loadingInsights: boolean;
    onBack: () => void;
    onFetchInsights: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

export const StudentDetailView = ({ student, insights, loadingInsights, onBack, onFetchInsights, onEdit, onDelete }: StudentDetailViewProps) => {
    const { theme, mode } = useTheme();
    const [previewImage, setPreviewImage] = useState<{ url: string, title: string } | null>(null);
    const styles = useMemo(() => createStyles(theme, mode), [theme, mode]);

    const [downloading, setDownloading] = useState(false);

    const handleDownload = async (url: string) => {
        try {
            setDownloading(true);

            // 1. Request Permissions
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Required", "Please allow gallery access to save images.");
                setDownloading(false);
                return;
            }

            // 2. Define path
            const filename = url.split('/').pop() || 'downloaded_image.jpg';
            const fileUri = `${(FileSystem as any).cacheDirectory}${filename}`;

            // 3. Download file
            const downloadResult = await (FileSystem as any).downloadAsync(url, fileUri);

            if (downloadResult.status !== 200) {
                throw new Error("Download failed");
            }

            // 4. Save to gallery
            await MediaLibrary.saveToLibraryAsync(downloadResult.uri);

            Alert.alert("Success", "Card saved to gallery successfully!");
        } catch (error) {
            console.error("Download Error:", error);
            Alert.alert("Download Failed", "There was an issue saving this image to your local storage. Please check your internet connection.");
        } finally {
            setDownloading(false);
        }
    };

    const infoItems = [
        { label: 'Branch', value: student.branch, icon: 'map-pin' as const, color: COLORS.indigo500 },
        { label: 'Session', value: student.session, icon: 'clock' as const, color: COLORS.amber500 },
        { label: 'Timings', value: student.sessionTimings, icon: 'calendar' as const, color: COLORS.emerald500 },
        { label: 'Monthly Fee', value: `₹${student.sessionFee}`, icon: 'credit-card' as const, color: COLORS.orange600 },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Clean Header */}
            <View style={styles.header}>
                <View style={styles.navBar}>
                    <TouchableOpacity onPress={onBack} style={styles.navBtn}>
                        <Feather name="arrow-left" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={onEdit} style={styles.navBtn}>
                            <Feather name="edit-3" size={20} color={theme.text} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onDelete} style={[styles.navBtn, { backgroundColor: mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' }]}>
                            <Feather name="trash-2" size={20} color={COLORS.red600} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.profileSection}>
                    <TouchableOpacity
                        onPress={() => setPreviewImage({ url: student.aadhaarFrontUrl, title: student.fullName })}
                        style={styles.imageWrapper}
                    >
                        <Image source={{ uri: student.aadhaarFrontUrl }} style={styles.profileImage} />
                        <View style={styles.statusBadge} />
                    </TouchableOpacity>
                    <View style={styles.profileText}>
                        <Text style={styles.name}>{student.fullName}</Text>
                        <View style={styles.phoneRow}>
                            <Feather name="phone" size={12} color={theme.textSecondary} />
                            <Text style={styles.phone}>{student.phoneNumber}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.body}>
                {/* Info Grid */}
                <View style={styles.infoGrid}>
                    {infoItems.map((item, idx) => (
                        <View key={idx} style={styles.infoCard}>
                            <View style={[styles.iconCircle, { backgroundColor: `${item.color}15` }]}>
                                <Feather name={item.icon} size={16} color={item.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel} numberOfLines={1}>{item.label}</Text>
                                <Text style={styles.infoValue} numberOfLines={2}>{item.value}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* AI Insights Card */}
                {(insights || loadingInsights) && (
                    <TouchableOpacity onPress={onFetchInsights} style={styles.insightCard}>
                        <View style={styles.insightHeader}>
                            <View style={styles.insightIcon}>
                                <Feather name="zap" size={18} color={COLORS.amber500} />
                            </View>
                            <Text style={styles.insightTitle}>Coach&apos;s Smart Insights</Text>
                            {loadingInsights && <View style={styles.pulseDot} />}
                        </View>
                        <Text style={styles.insightText}>
                            {loadingInsights ? 'Analyzing performance data...' : (insights || 'No insights available yet. Tap to analyze performance.')}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Attendance Heatmap */}
                <AttendanceHeatmap
                    attendanceHistory={student.attendanceHistory || []}
                    joiningDate={student.joiningDate || student.createdAt}
                />

                {/* Address Card */}
                <View style={styles.sectionCard}>
                    <View style={styles.cardHeader}>
                        <Feather name="map" size={18} color={theme.primary} />
                        <Text style={styles.sectionTitle}>Residence Address</Text>
                    </View>
                    <Text style={styles.addressText}>{student.address}</Text>
                </View>

                {/* Documents */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Identity Documents</Text>
                    <View style={styles.docRow}>
                        <TouchableOpacity
                            onPress={() => setPreviewImage({ url: student.aadhaarFrontUrl, title: 'Aadhaar Front' })}
                            style={styles.docCard}
                        >
                            <Image source={{ uri: student.aadhaarFrontUrl }} style={styles.docImage} />
                            <View style={styles.docOverlay}>
                                <Text style={styles.docTitle}>Aadhaar Front</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setPreviewImage({ url: student.aadhaarBackUrl, title: 'Aadhaar Back' })}
                            style={styles.docCard}
                        >
                            <Image source={{ uri: student.aadhaarBackUrl }} style={styles.docImage} />
                            <View style={styles.docOverlay}>
                                <Text style={styles.docTitle}>Aadhaar Back</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Joining Meta */}
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Joining Date</Text>
                        <Text style={styles.metaValue}>{student.joiningDate || new Date(student.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <View style={[styles.statusTag, { backgroundColor: COLORS.emerald100 }]}>
                        <Text style={[styles.statusText, { color: COLORS.emerald700 }]}>Active</Text>
                    </View>
                </View>

                {/* Fee History */}
                {student.feeHistory && student.feeHistory.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionHeader}>Payment History</Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAll}>See All</Text>
                            </TouchableOpacity>
                        </View>
                        {student.feeHistory.map((fee, idx) => {
                            const formattedPaidDate = fee.paidDate ? new Date(fee.paidDate).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                            }) : '-';

                            return (
                                <View key={idx} style={styles.feeListItem}>
                                    <View style={styles.feeInfo}>
                                        <View style={styles.feeIcon}>
                                            <Feather name="check" size={14} color={COLORS.emerald600} />
                                        </View>
                                        <View>
                                            <Text style={styles.feeMonth}>{fee.month}</Text>
                                            <Text style={styles.feeDate}>Paid on {formattedPaidDate}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.feeAmount}>₹{fee.amount}</Text>
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* Image Preview Modal */}
            <Modal
                visible={!!previewImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setPreviewImage(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{previewImage?.title}</Text>
                            <TouchableOpacity onPress={() => setPreviewImage(null)} style={styles.modalCloseBtn}>
                                <Feather name="x" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalImageWrapper}>
                            {previewImage && (
                                <Image
                                    source={{ uri: previewImage.url }}
                                    style={styles.modalImage}
                                    resizeMode="contain"
                                />
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.downloadBtn, downloading && { opacity: 0.7 }]}
                            onPress={() => previewImage && !downloading && handleDownload(previewImage.url)}
                            disabled={downloading}
                        >
                            {downloading ? (
                                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                            ) : (
                                <Feather name="download" size={20} color="#fff" />
                            )}
                            <Text style={styles.downloadBtnText}>
                                {downloading ? 'Downloading...' : 'Save to Gallery'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView >
    );
};

const createStyles = (theme: any, mode: string) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: mode === 'dark' ? '#0a0a0a' : '#f5f5f5',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        backgroundColor: theme.card,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: theme.border,
        paddingBottom: 16,
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    navBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerActions: {
        gap: 8,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 24,
        paddingBottom: 24,
        marginTop: 60,
    },
    imageWrapper: {
        width: 100,
        height: 100,
        borderRadius: 24,
        borderWidth: 4,
        borderColor: theme.surface,
        backgroundColor: theme.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    statusBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.emerald500,
        borderWidth: 3,
        borderColor: theme.surface,
    },
    profileText: {
        marginLeft: 16,
        marginBottom: 8,
        flex: 1,
    },
    name: {
        fontSize: 24,
        fontWeight: '900',
        color: theme.text,
        letterSpacing: -0.5,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    phone: {
        fontSize: 14,
        color: theme.textSecondary,
        fontWeight: '500',
    },
    body: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    infoCard: {
        width: (width - 52) / 2,
        backgroundColor: theme.card,
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: theme.border,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.textTertiary,
        textTransform: 'uppercase',
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.text,
        marginTop: 2,
    },
    insightCard: {
        backgroundColor: theme.card,
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.border,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    insightIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: mode === 'dark' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    insightTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.text,
        flex: 1,
    },
    insightText: {
        marginTop: 12,
        color: theme.textSecondary,
        fontSize: 14,
        fontStyle: 'italic',
        lineHeight: 22,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.amber500,
    },
    sectionCard: {
        backgroundColor: theme.card,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.text,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    addressText: {
        fontSize: 15,
        color: theme.textSecondary,
        lineHeight: 22,
        fontWeight: '500',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.text,
        marginBottom: 16,
    },
    seeAll: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.primary,
    },
    docRow: {
        flexDirection: 'row',
        gap: 12,
    },
    docCard: {
        flex: 1,
        height: 120,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.border,
    },
    docImage: {
        width: '100%',
        height: '100%',
    },
    docOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    docTitle: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.primaryLight,
        padding: 16,
        borderRadius: 20,
        marginBottom: 24,
    },
    metaItem: {
        gap: 2,
    },
    metaLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.primary,
        textTransform: 'uppercase',
    },
    metaValue: {
        fontSize: 15,
        fontWeight: '800',
        color: theme.primary,
    },
    statusTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    feeListItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.border,
    },
    feeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    feeIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.emerald50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    feeMonth: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.text,
    },
    feeDate: {
        fontSize: 12,
        color: theme.textTertiary,
        marginTop: 1,
    },
    feeAmount: {
        fontSize: 16,
        fontWeight: '900',
        color: theme.text,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '100%',
        height: '100%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    modalCloseBtn: {
        padding: 8,
    },
    modalImageWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalImage: {
        width: '100%',
        height: '100%',
    },
    downloadBtn: {
        flexDirection: 'row',
        backgroundColor: theme.primary,
        padding: 16,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginBottom: 40,
    },
    downloadBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
