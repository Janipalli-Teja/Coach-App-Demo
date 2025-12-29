import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants/design';
import { useTheme } from '../../contexts/ThemeContext';
import { ScalePress } from './ScalePress';

const { width } = Dimensions.get('window');

interface CustomAlertProps {
    visible: boolean;
    type?: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    primaryButton?: string;
    secondaryButton?: string;
    onPrimaryPress?: () => void;
    onSecondaryPress?: () => void;
    onClose: () => void;
}

export const CustomAlert = ({
    visible,
    type = 'info',
    title,
    message,
    primaryButton = 'OK',
    secondaryButton,
    onPrimaryPress,
    onSecondaryPress,
    onClose,
}: CustomAlertProps) => {
    const { theme, mode } = useTheme();

    const getIcon = () => {
        switch (type) {
            case 'success':
                return { name: 'check-circle' as const, color: COLORS.emerald500 };
            case 'error':
                return { name: 'x-circle' as const, color: COLORS.red600 };
            case 'warning':
                return { name: 'alert-triangle' as const, color: COLORS.amber500 };
            default:
                return { name: 'info' as const, color: COLORS.indigo500 };
        }
    };

    const icon = getIcon();

    const handlePrimary = () => {
        if (onPrimaryPress) {
            onPrimaryPress();
        }
        onClose();
    };

    const handleSecondary = () => {
        if (onSecondaryPress) {
            onSecondaryPress();
        }
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View style={[styles.container, { backgroundColor: theme.card }]}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, {
                        backgroundColor: mode === 'dark'
                            ? `${icon.color}20`
                            : `${icon.color}15`
                    }]}>
                        <Feather name={icon.name} size={32} color={icon.color} />
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

                    {/* Message */}
                    <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        {secondaryButton && (
                            <ScalePress onPress={handleSecondary} style={styles.buttonWrapper}>
                                <View style={[styles.button, styles.secondaryButton, {
                                    backgroundColor: mode === 'dark'
                                        ? 'rgba(255,255,255,0.05)'
                                        : 'rgba(0,0,0,0.05)',
                                    borderColor: theme.border,
                                }]}>
                                    <Text style={[styles.buttonText, { color: theme.text }]}>
                                        {secondaryButton}
                                    </Text>
                                </View>
                            </ScalePress>
                        )}
                        <ScalePress onPress={handlePrimary} style={styles.buttonWrapper}>
                            <View style={[styles.button, styles.primaryButton, {
                                backgroundColor: icon.color,
                            }]}>
                                <Text style={[styles.buttonText, { color: COLORS.white }]}>
                                    {primaryButton}
                                </Text>
                            </View>
                        </ScalePress>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    container: {
        width: width - 80,
        maxWidth: 340,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 20,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    buttonWrapper: {
        flex: 1,
    },
    button: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    secondaryButton: {
        borderWidth: 1,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});
