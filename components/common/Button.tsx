import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../constants/design';

interface ButtonProps {
    children: React.ReactNode;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    style?: ViewStyle;
    disabled?: boolean;
}

export const Button = ({ children, onPress, variant = 'primary', style, disabled }: ButtonProps) => {
    const getBackgroundColor = () => {
        if (disabled) return COLORS.slate300;
        switch (variant) {
            case 'primary': return COLORS.indigo600;
            case 'secondary': return COLORS.indigo50;
            case 'outline': return 'transparent';
            case 'danger': return COLORS.red50;
            default: return COLORS.indigo600;
        }
    };

    const getTextColor = () => {
        if (disabled) return COLORS.white;
        switch (variant) {
            case 'primary': return COLORS.white;
            case 'secondary': return COLORS.indigo600;
            case 'outline': return COLORS.slate500;
            case 'danger': return COLORS.red600;
            default: return COLORS.white;
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            style={[
                styles.buttonBase,
                { backgroundColor: getBackgroundColor() },
                variant === 'outline' && { borderWidth: 2, borderColor: COLORS.slate200 },
                style
            ]}
        >
            <Text style={[styles.buttonText, { color: getTextColor() }]}>{children}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    buttonBase: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
