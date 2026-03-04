import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useSettings } from '@/hooks/useSettings';
import { useDreams } from '@/hooks/useDreams';
import { GlassCard } from '@/components/ui/GlassCard';
import { theme } from '@/constants/theme';
import { scheduleRecurringNotifications, cancelNotifications } from '@/services/notifications';
import { DisplayMode } from '@/services/settings';
import { useAlert } from '@/template';

const INTERVALS = [
  { label: '30 دقيقة', value: 30 },
  { label: '50 دقيقة', value: 50 },
  { label: '60 دقيقة', value: 60 },
  { label: '90 دقيقة', value: 90 },
  { label: '120 دقيقة', value: 120 },
];

const DISPLAY_MODES = [
  { label: 'عشوائي', value: 'random' as DisplayMode, icon: 'shuffle' },
  { label: 'آخر حلم', value: 'latest' as DisplayMode, icon: 'update' },
  { label: 'متسلسل', value: 'sequential' as DisplayMode, icon: 'view-list' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const { dreams, exportDreams, importDreams, clearAll } = useDreams();
  const { showAlert } = useAlert();
  const [updating, setUpdating] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleToggleNotifications = async (enabled: boolean) => {
    setUpdating(true);
    try {
      if (enabled) {
        await scheduleRecurringNotifications(settings.notificationInterval);
      } else {
        await cancelNotifications();
      }
      await updateSettings({ notificationsEnabled: enabled });
      showAlert(
        enabled ? 'تم التفعيل' : 'تم التعطيل',
        enabled 
          ? 'سيتم إرسال تذكير لمراجعة أحلامك' 
          : 'تم إيقاف التذكير'
      );
    } catch (error) {
      console.error('Error toggling notifications:', error);
      showAlert('خطأ', 'حدث خطأ أثناء تغيير الإعدادات');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangeInterval = async (interval: number) => {
    setUpdating(true);
    try {
      await updateSettings({ notificationInterval: interval });
      if (settings.notificationsEnabled) {
        await scheduleRecurringNotifications(interval);
      }
    } catch (error) {
      console.error('Error changing interval:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleChangeDisplayMode = async (mode: DisplayMode) => {
    setUpdating(true);
    try {
      await updateSettings({ displayMode: mode });
    } catch (error) {
      console.error('Error changing display mode:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleExport = async () => {
    if (dreams.length === 0) {
      showAlert('تنبيه', 'لا توجد أحلام لتصديرها');
      return;
    }

    setProcessing(true);
    try {
      const jsonData = await exportDreams();
      const fileName = `DreamRecall_Backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, jsonData, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'تصدير الأحلام',
        });
        showAlert('نجح التصدير ✨', `تم تصدير ${dreams.length} حلم`);
      }
    } catch (error) {
      console.error('Error exporting dreams:', error);
      showAlert('خطأ', 'حدث خطأ أثناء التصدير');
    } finally {
      setProcessing(false);
    }
  };

  const handleImport = async () => {
    setProcessing(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        setProcessing(false);
        return;
      }

      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      const importResult = await importDreams(fileContent);
      
      showAlert(
        'نجح الاستيراد ✨',
        `تم استيراد ${importResult.success} من ${importResult.total} حلم`
      );
    } catch (error) {
      console.error('Error importing dreams:', error);
      showAlert('خطأ', 'حدث خطأ أثناء الاستيراد. تأكد من صحة الملف');
    } finally {
      setProcessing(false);
    }
  };

  const handleClearAll = () => {
    showAlert(
      'تأكيد الحذف',
      `سيتم حذف جميع الأحلام (${dreams.length} حلم). هل أنت متأكد؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف الكل',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              await clearAll();
              showAlert('تم الحذف', 'تم حذف جميع الأحلام');
            } catch (error) {
              console.error('Error clearing dreams:', error);
              showAlert('خطأ', 'حدث خطأ أثناء الحذف');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.title}>الإعدادات</Text>
        <MaterialIcons name="settings" size={32} color={theme.colors.primary} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="notifications" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>الإشعارات</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>تفعيل التذكير</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={handleToggleNotifications}
              disabled={updating}
              trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
              thumbColor={settings.notificationsEnabled ? theme.colors.primary : theme.colors.textTertiary}
            />
          </View>

          {settings.notificationsEnabled && (
            <>
              <Text style={styles.subsectionTitle}>التكرار</Text>
              <View style={styles.optionsGrid}>
                {INTERVALS.map((interval) => (
                  <Pressable
                    key={interval.value}
                    style={[
                      styles.optionButton,
                      settings.notificationInterval === interval.value && styles.optionButtonActive,
                    ]}
                    onPress={() => handleChangeInterval(interval.value)}
                    disabled={updating}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        settings.notificationInterval === interval.value && styles.optionTextActive,
                      ]}
                    >
                      {interval.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </GlassCard>

        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="visibility" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>عرض الأحلام</Text>
          </View>

          <Text style={styles.subsectionTitle}>عند الضغط على الإشعار</Text>
          <View style={styles.displayModes}>
            {DISPLAY_MODES.map((mode) => (
              <Pressable
                key={mode.value}
                style={[
                  styles.modeCard,
                  settings.displayMode === mode.value && styles.modeCardActive,
                ]}
                onPress={() => handleChangeDisplayMode(mode.value)}
                disabled={updating}
              >
                <MaterialIcons 
                  name={mode.icon as any} 
                  size={28} 
                  color={settings.displayMode === mode.value ? theme.colors.primary : theme.colors.textSecondary} 
                />
                <Text
                  style={[
                    styles.modeText,
                    settings.displayMode === mode.value && styles.modeTextActive,
                  ]}
                >
                  {mode.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </GlassCard>

        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="backup" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>النسخ الاحتياطي</Text>
          </View>

          <Pressable
            style={styles.backupButton}
            onPress={handleExport}
            disabled={processing || dreams.length === 0}
          >
            <MaterialIcons name="cloud-upload" size={24} color={theme.colors.text} />
            <View style={styles.backupTextContainer}>
              <Text style={styles.backupTitle}>تصدير الأحلام</Text>
              <Text style={styles.backupSubtitle}>حفظ نسخة احتياطية بصيغة JSON</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.backupButton}
            onPress={handleImport}
            disabled={processing}
          >
            <MaterialIcons name="cloud-download" size={24} color={theme.colors.text} />
            <View style={styles.backupTextContainer}>
              <Text style={styles.backupTitle}>استيراد الأحلام</Text>
              <Text style={styles.backupSubtitle}>استرجاع نسخة احتياطية من ملف JSON</Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.backupButton, styles.dangerButton]}
            onPress={handleClearAll}
            disabled={processing || dreams.length === 0}
          >
            <MaterialIcons name="delete-forever" size={24} color={theme.colors.error} />
            <View style={styles.backupTextContainer}>
              <Text style={[styles.backupTitle, styles.dangerText]}>حذف جميع الأحلام</Text>
              <Text style={styles.backupSubtitle}>احذر: هذا الإجراء لا يمكن التراجع عنه</Text>
            </View>
          </Pressable>
        </GlassCard>

        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="info-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>حول التطبيق</Text>
          </View>

          <Text style={styles.aboutText}>
            DreamRecall - تطبيق لتدوين ومراجعة أحلامك اليومية
          </Text>
          <Text style={[styles.aboutText, styles.version]}>
            الإصدار 1.0.0
          </Text>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: theme.fonts.medium,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  optionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionButtonActive: {
    backgroundColor: 'rgba(106, 0, 255, 0.2)',
    borderColor: theme.colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
  },
  optionTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
  },
  displayModes: {
    gap: theme.spacing.sm,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modeCardActive: {
    backgroundColor: 'rgba(106, 0, 255, 0.2)',
    borderColor: theme.colors.primary,
  },
  modeText: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
  },
  modeTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
  },
  aboutText: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  version: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontFamily: theme.fonts.regular,
  },
  backupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  backupTextContainer: {
    flex: 1,
  },
  backupTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  backupSubtitle: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textTertiary,
  },
  dangerButton: {
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  dangerText: {
    color: theme.colors.error,
  },
});
