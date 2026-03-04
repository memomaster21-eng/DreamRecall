import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useDreams } from '@/hooks/useDreams';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { getDreamById } from '@/services/database';
import { useAlert } from '@/template';

export default function EditDreamScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { editDream } = useDreams();
  const { showAlert } = useAlert();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadDream = async () => {
      try {
        const dreamId = parseInt(id as string);
        const dream = await getDreamById(dreamId);
        
        if (dream) {
          setTitle(dream.title);
          setContent(dream.content);
          setTags(dream.tags || '');
        } else {
          showAlert('خطأ', 'لم يتم العثور على الحلم');
          router.back();
        }
      } catch (error) {
        console.error('Error loading dream:', error);
        showAlert('خطأ', 'حدث خطأ أثناء تحميل الحلم');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadDream();
    }
  }, [id]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      showAlert('خطأ', 'الرجاء إدخال عنوان الحلم');
      return;
    }

    if (!content.trim()) {
      showAlert('خطأ', 'الرجاء إدخال وصف الحلم');
      return;
    }

    setSaving(true);

    try {
      const dreamId = parseInt(id as string);
      await editDream(dreamId, {
        title: title.trim(),
        content: content.trim(),
        tags: tags.trim(),
      });

      showAlert('تم التحديث ✨', 'تم تحديث حلمك بنجاح');
      router.back();
    } catch (error) {
      console.error('Error updating dream:', error);
      showAlert('خطأ', 'حدث خطأ أثناء تحديث الحلم');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialIcons 
            name="arrow-back" 
            size={28} 
            color={theme.colors.text} 
            onPress={() => router.back()}
            style={styles.backButton}
          />
          <Text style={styles.title}>تعديل الحلم</Text>
        </View>
        <MaterialIcons name="edit" size={32} color={theme.colors.primary} />
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
            title="حفظ التغييرات"
            onPress={handleSubmit}
            loading={saving}
            style={styles.saveButton}
          />

          <Button
            title="إلغاء"
            variant="ghost"
            onPress={() => router.back()}
            disabled={saving}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backButton: {
    padding: 4,
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
    marginBottom: theme.spacing.sm,
  },
});
