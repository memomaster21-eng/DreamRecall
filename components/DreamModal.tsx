import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { Dream } from '@/services/database';
import { GlassCard } from './ui/GlassCard';
import { theme } from '@/constants/theme';

interface DreamModalProps {
  visible: boolean;
  dream: Dream | null;
  onClose: () => void;
  onEdit?: () => void;
  onNext?: () => void;
  showNext?: boolean;
}

export const DreamModal: React.FC<DreamModalProps> = ({
  visible,
  dream,
  onClose,
  onEdit,
  onNext,
  showNext = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!dream) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <BlurView intensity={40} style={styles.blur}>
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <GlassCard style={styles.card}>
            <View style={styles.header}>
              <MaterialIcons name="nights-stay" size={32} color={theme.colors.primary} />
              <Pressable onPress={onClose} hitSlop={8}>
                <MaterialIcons name="close" size={28} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.title}>{dream.title}</Text>
            <Text style={styles.date}>{formatDate(dream.date)}</Text>

            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.content}>{dream.content}</Text>

              {dream.tags && (
                <View style={styles.tagsContainer}>
                  {dream.tags.split(',').map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag.trim()}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.actions}>
              {onEdit && (
                <Pressable 
                  style={styles.actionButton}
                  onPress={onEdit}
                >
                  <MaterialIcons name="edit" size={20} color={theme.colors.text} />
                  <Text style={styles.actionText}>تعديل</Text>
                </Pressable>
              )}
              
              {showNext && onNext && (
                <Pressable 
                  style={[styles.actionButton, styles.nextButton]}
                  onPress={onNext}
                >
                  <MaterialIcons name="navigate-next" size={20} color="#FFFFFF" />
                  <Text style={[styles.actionText, styles.nextText]}>التالي</Text>
                </Pressable>
              )}
            </View>
          </GlassCard>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blur: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  card: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  date: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.lg,
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingBottom: theme.spacing.md,
  },
  content: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tag: {
    backgroundColor: 'rgba(106, 0, 255, 0.3)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  tagText: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primaryLight,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: theme.spacing.xs,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  nextText: {
    color: '#FFFFFF',
  },
});
