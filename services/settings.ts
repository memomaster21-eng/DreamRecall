import AsyncStorage from '@react-native-async-storage/async-storage';

export type DisplayMode = 'random' | 'latest' | 'specific' | 'sequential';

export interface Settings {
  displayMode: DisplayMode;
  specificDreamId: number | null;
  notificationInterval: number;
  notificationsEnabled: boolean;
}

const SETTINGS_KEY = 'app_settings';

const DEFAULT_SETTINGS: Settings = {
  displayMode: 'random',
  specificDreamId: null,
  notificationInterval: 60,
  notificationsEnabled: false,
};

export const getSettings = async (): Promise<Settings> => {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting settings:', error);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings: Partial<Settings>) => {
  try {
    const current = await getSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

export const resetSettings = async () => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  } catch (error) {
    console.error('Error resetting settings:', error);
  }
};
