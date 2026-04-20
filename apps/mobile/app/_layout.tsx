import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/auth.store';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../global.css';

export default function RootLayout() {
  const hydrate   = useAuthStore((s) => s.hydrate);
  const scheme    = useColorScheme();
  const isDark    = scheme === 'dark';

  useEffect(() => { hydrate(); }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: isDark ? '#0f0e17' : '#f7f9fb' },
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
