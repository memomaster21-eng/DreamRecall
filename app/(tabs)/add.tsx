import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useDreams } from '@/hooks/useDreams';
import { useSettings } from '@/hooks/useSettings';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { getDreamsCount } from '@/services/database';
import { requestNotificationPermissions, scheduleRecurringNotifications } from '@/services/notifications';
import { useAlert } from '@/template';

export default function AddDreamScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createDream } = useDreams();
  const { settings, updateSettings } = useSettings();
  const { showAlert } = useAlert();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      showAlert('خطأ', 'الرجاء إدخال عنوان الحلم');
      return;
    }

    if (!content.trim()) {
      showAlert('خطأ', 'الرجاء إدخال وصف الحلم');
      return;
    }

    setLoading(true);

    try {
      const currentCount = await getDreamsCount();
      
      await createDream({
        title: title.trim(),
        content: content.trim(),
        date: new Date().toISOString(),
        tags: tags.trim(),
      });

      if (currentCount === 0 && !settings.notificationsEnabled) {
        const hasPermission = await requestNotificationPermissions();
        
        if (hasPermission) {
          await scheduleRecurringNotifications(settings.notificationInterval);
          await updateSettings({ notificationsEnabled: true });
          
          showAlert(
            'تم التفعيل ✨',
            'تم تفعيل التذكير بمراجعة الأحلام',
            [{ text: 'حسناً', style: 'default' }]
          );
        }
      }

      setTitle('');
      setContent('');
      setTags('');
      
      showAlert('تم الحفظ ✨', 'تم حفظ حلمك بنجاح');
      router.push('/(tabs)/');
    } catch (error) {
      console.error('Error saving dream:', error);
      showAlert('خطأ', 'حدث خطأ أثناء حفظ الحلم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.title}>حلم جديد</Text>
        <MaterialIcons name="nights-stay" size={32} color={theme.colors.primary} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="عنوان الحلم"
            placeholder="أدخل عنواناً لحلمك..."
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          <View style={styles.textAreaContainer}>
            <Text style={styles.label}>وصف الحلم</Text>
            <Input
              placeholder="اكتب حلمك بالتفصيل..."
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              style={styles.textArea}
            />
          </View>

          <Input
            label="الوسوم (اختياري)"
            placeholder="مثال: سعيد، غريب، واضح"
            value={tags}
            onChangeText={setTags}
          />

          <View style={styles.info}>
            <MaterialIcons name="info-outline" size={16} color={theme.colors.textTertiary} />
            <Text style={styles.infoText}>
              يمكنك الفصل بين الوسوم بفاصلة
            </Text>
          </View>

          <Button
            title="حفظ الحلم"
            onPress={handleSubmit}
            loading={loading}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  label: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: theme.fonts.medium,
    marginBottom: theme.spacing.sm,
  },
  textAreaContainer: {
    marginBottom: theme.spacing.md,
  },
  textArea: {
    minHeight: 150,
    paddingTop: theme.spacing.md,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  infoText: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textTertiary,
  },
  saveButton: {
    marginTop: theme.spacing.md,
  },
});
