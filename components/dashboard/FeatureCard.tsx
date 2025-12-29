
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface FeatureCardProps {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    colors: [string, string, string];
    onPress: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ title, icon, colors, onPress }) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.container}>
            <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={32} color="white" />
                </View>
                <Text style={styles.title}>{title}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 120,
        marginBottom: 20,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    gradient: {
        flex: 1,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
    },
});
