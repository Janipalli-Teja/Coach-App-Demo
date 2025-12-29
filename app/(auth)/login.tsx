
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { getFriendlyErrorMessage } from '../../services/errorService';
import { useTheme } from '../../contexts/ThemeContext';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            console.error(err);
            setError(getFriendlyErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.header}>
                        <View style={[styles.trophyIcon, { backgroundColor: theme.surface }]}>
                            <Ionicons name="trophy" size={40} color={theme.primary} />
                        </View>
                        <Text style={[styles.title, { color: theme.text }]}>Academy Coach</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Sign in to manage your academy</Text>
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Ionicons name="mail-outline" size={20} color={theme.textTertiary} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Email Address"
                            placeholderTextColor={theme.textTertiary}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Ionicons name="lock-closed-outline" size={20} color={theme.textTertiary} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Password"
                            placeholderTextColor={theme.textTertiary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary }]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        borderRadius: 32,
        padding: 30,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    trophyIcon: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 10,
    },
    subtitle: {
        fontSize: 14,
        marginTop: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        marginBottom: 15,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    button: {
        borderRadius: 10,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#ff3b30',
        marginBottom: 15,
        textAlign: 'center',
    },
});
