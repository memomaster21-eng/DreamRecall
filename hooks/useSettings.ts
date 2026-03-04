import { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings, Settings } from '@/services/settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>({
    displayMode: 'random',
    specificDreamId: null,
    notificationInterval: 60,
    notificationsEnabled: false,
  });
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    try {
      await saveSettings(updates);
      setSettings((prev) => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }, []);

  return {
    settings,
    loading,
    updateSettings,
    refresh: loadSettings,
  };
};
