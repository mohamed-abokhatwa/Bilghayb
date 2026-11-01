import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  CormorantGaramond_500Medium,
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { AppProvider, backendMissing, useApp } from '../lib/store';
import { ErrorBoundary as AppErrorBoundary } from '../components/ErrorBoundary';
import { colors } from '../theme';
import { getPushToken } from '../lib/notifications';

SplashScreen.preventAutoHideAsync().catch(() => {});

export { AppErrorBoundary as ErrorBoundary };

function Root() {
  const { ready, prefs, api } = useApp();
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_500Medium,
    CormorantGaramond_500Medium_Italic,
    CormorantGaramond_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Amiri_400Regular,
    Amiri_700Bold,
  });
  const loaded = ready && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  // Live mode: register this device so the server can send reminders.
  useEffect(() => {
    if (!prefs.onboarded || api.mode !== 'live') return;
    getPushToken()
      .then((pushToken) => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        return api.updateProfile(pushToken ? { pushToken, tz } : { tz });
      })
      .catch(() => {});
  }, [prefs.onboarded, api]);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  if (backendMissing) {
    // Only seen if a store build was made without EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY.
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ color: colors.ivory, fontSize: 20, textAlign: 'center', marginBottom: 8 }}>Setup incomplete</Text>
        <Text style={{ color: colors.textMuted, fontSize: 15, textAlign: 'center' }}>
          This build has no database keys. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY as EAS
          environment variables and build again.
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="pilgrim" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="janazah" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="guide" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ backgroundColor: colors.bg }}>
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}
