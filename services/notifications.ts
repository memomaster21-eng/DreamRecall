import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_MESSAGES = [
  'راجع أحلامك الآن ✨',
  'حلمك ينتظرك 🌙',
  'هل تتذكر هذا الحلم؟ 💭',
  'وقت استرجاع الأحلام 🌟',
  'أحلامك تنتظر المراجعة 🌌',
];

const STORAGE_KEYS = {
  INTERVAL: 'notification_interval',
  ENABLED: 'notifications_enabled',
  LAST_SHOWN_ID: 'last_shown_dream_id',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!Device.isDevice) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('dream-reminders', {
      name: 'تذكير الأحلام',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6A00FF',
      sound: 'default',
    });
  }

  return true;
};

export const scheduleRecurringNotifications = async (intervalMinutes: number) => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  await AsyncStorage.setItem(STORAGE_KEYS.INTERVAL, intervalMinutes.toString());
  await AsyncStorage.setItem(STORAGE_KEYS.ENABLED, 'true');

  const randomMessage = NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'DreamRecall',
      body: randomMessage,
      data: { type: 'dream_reminder' },
      sound: 'default',
    },
    trigger: {
      seconds: intervalMinutes * 60,
      repeats: true,
    },
  });
};

export const cancelNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.setItem(STORAGE_KEYS.ENABLED, 'false');
};

export const getNotificationSettings = async () => {
  const interval = await AsyncStorage.getItem(STORAGE_KEYS.INTERVAL);
  const enabled = await AsyncStorage.getItem(STORAGE_KEYS.ENABLED);
  
  return {
    interval: interval ? parseInt(interval) : 60,
    enabled: enabled === 'true',
  };
};

export const saveLastShownDreamId = async (dreamId: number) => {
  await AsyncStorage.setItem(STORAGE_KEYS.LAST_SHOWN_ID, dreamId.toString());
};

export const getLastShownDreamId = async (): Promise<number | null> => {
  const id = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SHOWN_ID);
  return id ? parseInt(id) : null;
};
