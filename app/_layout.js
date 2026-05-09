import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import 'react-native-reanimated';
import * as Notifications from 'expo-notifications';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { extractNotificationRequestId, extractNotificationRoleId } from '../utils/notificationNavigation';

import { Platform, LogBox } from 'react-native';

// Suppress known warnings on web
if (Platform.OS === 'web') {
  const ignoreMessages = [
    'shadow*',
    'pointerEvents',
    '[expo-notifications]',
    'Password field is not contained in a form',
    'Unexpected reserved word',
    'boxShadow'
  ];

  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && ignoreMessages.some(m => args[0].includes(m))) return;
    originalWarn(...args);
  };

  const originalError = console.error;
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && ignoreMessages.some(m => args[0].includes(m))) return;
    originalError(...args);
  };
  
  LogBox.ignoreAllLogs();
}

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const routeFromNotificationResponse = useCallback((response) => {
    if (!response) return;

    const requestId = extractNotificationRequestId(response);
    if (!requestId) return;

    const roleId = extractNotificationRoleId(response);
    const params = { notifRequestId: String(requestId) };
    if (roleId) params.notifRoleId = String(roleId);

    router.push({ pathname: '/(tabs)', params });
  }, [router]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      routeFromNotificationResponse(response);
    });

    Notifications.getLastNotificationResponseAsync()
      .then((response) => routeFromNotificationResponse(response))
      .catch(() => {});

    return () => {
      subscription.remove();
    };
  }, [routeFromNotificationResponse]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
