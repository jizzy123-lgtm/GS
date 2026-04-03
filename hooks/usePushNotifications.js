import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { API_URL } from '../api';

export async function registerForPushNotificationsAsync(authToken) {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      if (!projectId) {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } else {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      }

      console.log('Got Expo Push Token:', token);

      // Send the token to the backend
      if (token && authToken) {
        const response = await fetch(`${API_URL}/users/push-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            expo_push_token: token
          })
        });

        if (!response.ok) {
          console.error("Failed to register push token with backend:", await response.text());
        } else {
          console.log("Successfully registered device token with backend.");
        }
      }
    } catch (e) {
      console.log('Error getting or sending push token:', e);
    }
  } else {
    console.log('Must use a physical device for Push Notifications');
  }

  return token;
}
