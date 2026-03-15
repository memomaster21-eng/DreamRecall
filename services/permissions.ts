import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'onboarding_completed',
};

export interface PermissionStatus {
  notifications: boolean;
  batteryOptimization: boolean;
}

export const checkOnboardingCompleted = async (): Promise<boolean> => {
  const completed = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
  return completed === 'true';
};

export const setOnboardingCompleted = async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
};

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

export const openBatterySettings = () => {
  if (Platform.OS === 'android') {
    Alert.alert(
      'تحسين البطارية',
      'لضمان عمل التطبيق في الخلفية بشكل مستمر:\n\n1. افتح الإعدادات\n2. انتقل إلى "البطارية"\n3. اختر "تحسين البطارية"\n4. ابحث عن "DreamRecall"\n5. اختر "عدم التحسين"\n\nهل تريد فتح الإعدادات الآن؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'فتح الإعدادات', onPress: () => Linking.openSettings() },
      ]
    );
  } else if (Platform.OS === 'ios') {
    Alert.alert(
      'السماح بالعمل في الخلفية',
      'لضمان عمل التطبيق في الخلفية:\n\n1. افتح الإعدادات\n2. انتقل إلى "عام"\n3. اختر "تحديث التطبيق في الخلفية"\n4. فعّل "DreamRecall"\n\nهل تريد فتح الإعدادات الآن؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'فتح الإعدادات', onPress: () => Linking.openSettings() },
      ]
    );
  }
};

export const checkPermissions = async (): Promise<PermissionStatus> => {
  const { status } = await Notifications.getPermissionsAsync();
  
  return {
    notifications: status === 'granted',
    batteryOptimization: true, // لا يمكن التحقق برمجياً
  };
};
