import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Dream } from '@/services/database';
import { GlassCard } from './ui/GlassCard';
import { theme } from '@/constants/theme';

interface DreamCardProps {
  dream: Dream;
  onPress: () => void;
}

export const DreamCard: React.FC<DreamCardProps> = ({ dream, onPress }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        pressed && styles.pressed,
      ]}
    >
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {dream.title}
          </Text>
          <MaterialIcons name="nights-stay" size={24} color={theme.colors.primary} />
        </View>
        
        <Text style={styles.content} numberOfLines={3}>
          {dream.content}
        </Text>
        
        <View style={styles.footer}>
          <Text style={styles.date}>{formatDate(dream.date)}</Text>
          {dream.tags && (
            <View style={styles.tagsContainer}>
              {dream.tags.split(',').slice(0, 2).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag.trim()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </GlassCard>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  content: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textTertiary,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  tag: {
    backgroundColor: 'rgba(106, 0, 255, 0.2)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  tagText: {
    fontSize: 10,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primaryLight,
    fontWeight: '500',
  },
});
