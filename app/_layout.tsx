import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import 'react-native-reanimated';
import * as Notifications from 'expo-notifications';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { extractNotificationRequestId, extractNotificationRoleId } from '../utils/notificationNavigation';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const routeFromNotificationResponse = useCallback((response: Notifications.NotificationResponse | null) => {
    if (!response) return;

    const requestId = extractNotificationRequestId(response);
    if (!requestId) return;

    const roleId = extractNotificationRoleId(response);
    const params: Record<string, string> = { notifRequestId: String(requestId) };
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
