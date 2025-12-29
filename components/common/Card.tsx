import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps {
    children: React.ReactNode;
    onPress?: () => void;
    style?: ViewStyle | ViewStyle[];
    contentStyle?: ViewStyle;
    variant?: 'glass' | 'solid'; // Keep for compatibility
    backgroundColor?: string;
}

export const Card = ({ children, onPress, style, contentStyle, backgroundColor }: CardProps) => {
    const { theme, mode } = useTheme();
    const Container = onPress ? TouchableOpacity : View;

    const containerStyles = [
        styles.container,
        {
            backgroundColor: backgroundColor || (mode === 'dark' ? '#0F172A' : '#FFFFFF'),
            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.05)',
            borderWidth: 1,
            shadowColor: '#000',
            shadowOpacity: mode === 'dark' ? 0.3 : 0.05,
            shadowRadius: 8,
            elevation: 2,
        },
        style
    ];

    return (
        // @ts-ignore
        <Container onPress={onPress} style={containerStyles} activeOpacity={0.7}>
            <View style={[styles.content, contentStyle]}>
                {children}
            </View>
        </Container>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    content: {
        padding: 20,
    }
});
