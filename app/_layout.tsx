import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { extractNotificationRequestId, extractNotificationRoleId } from '../utils/notificationNavigation';
import Constants from 'expo-constants';

let Notifications: any = null;
if (Constants.appOwnership !== 'expo') {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    console.log('Push notifications not supported in this environment');
  }
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const routeFromNotificationResponse = useCallback((response: any) => {
    if (!response) return;

    const requestId = extractNotificationRequestId(response);
    if (!requestId) return;

    const roleId = extractNotificationRoleId(response);
    const params: Record<string, string> = { notifRequestId: String(requestId) };
    if (roleId) params.notifRoleId = String(roleId);

    router.push({ pathname: '/(tabs)', params });
  }, [router]);

  useEffect(() => {
    if (!Notifications) return;
    
    const subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
      routeFromNotificationResponse(response);
    });

    Notifications.getLastNotificationResponseAsync()
      .then((response: any) => routeFromNotificationResponse(response))
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
