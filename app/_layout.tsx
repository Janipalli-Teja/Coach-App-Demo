import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LogBox } from 'react-native';

import { ThemeProvider as AppThemeProvider } from '../contexts/ThemeContext';

// Ignore the warning about setLayoutAnimationEnabledExperimental which is a no-op in New Architecture
LogBox.ignoreLogs(['setLayoutAnimationEnabledExperimental']);

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to the login page.
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect away from the login page.
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

// ...

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppThemeProvider>
        <RootLayoutNav />
      </AppThemeProvider>
    </AuthProvider>
  );
}
