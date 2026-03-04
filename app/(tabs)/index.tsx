import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useDreams } from '@/hooks/useDreams';
import { DreamCard } from '@/components/DreamCard';
import { DreamModal } from '@/components/DreamModal';
import { theme } from '@/constants/theme';
import { Dream, getRandomDream, getDreamById, getLatestDream, searchDreams, DateFilter } from '@/services/database';
import { getSettings } from '@/services/settings';
import { saveLastShownDreamId, getLastShownDreamId } from '@/services/notifications';

const DATE_FILTERS = [
  { label: 'الكل', value: 'all' as DateFilter },
  { label: 'هذا الأسبوع', value: 'week' as DateFilter },
  { label: 'هذا الشهر', value: 'month' as DateFilter },
  { label: 'هذه السنة', value: 'year' as DateFilter },
];

export default function DreamsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { dreams, loading, refresh } = useDreams();
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [filteredDreams, setFilteredDreams] = useState<Dream[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      if (response.notification.request.content.data.type === 'dream_reminder') {
        await handleNotificationPress();
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      setSearching(true);
      try {
        const results = await searchDreams(searchQuery, dateFilter);
        setFilteredDreams(results);
      } catch (error) {
        console.error('Search error:', error);
        setFilteredDreams(dreams);
      } finally {
        setSearching(false);
      }
    };

    performSearch();
  }, [searchQuery, dateFilter, dreams]);

  const handleNotificationPress = async () => {
    const settings = await getSettings();
    let dream: Dream | null = null;

    switch (settings.displayMode) {
      case 'random':
        const lastId = await getLastShownDreamId();
        dream = await getRandomDream(lastId || undefined);
        break;
      case 'latest':
        dream = await getLatestDream();
        break;
      case 'specific':
        if (settings.specificDreamId) {
          dream = await getDreamById(settings.specificDreamId);
        }
        break;
      case 'sequential':
        const lastShownId = await getLastShownDreamId();
        if (lastShownId) {
          const allDreams = dreams;
          const currentIndex = allDreams.findIndex((d) => d.id === lastShownId);
          const nextIndex = (currentIndex + 1) % allDreams.length;
          dream = allDreams[nextIndex];
        } else {
          dream = dreams[0];
        }
        break;
    }

    if (dream) {
      await saveLastShownDreamId(dream.id);
      setSelectedDream(dream);
      setModalVisible(true);
    }
  };

  const handleDreamPress = (dream: Dream) => {
    setSelectedDream(dream);
    setModalVisible(true);
  };

  const handleNext = async () => {
    const lastId = await getLastShownDreamId();
    const dream = await getRandomDream(lastId || undefined);
    if (dream) {
      await saveLastShownDreamId(dream.id);
      setSelectedDream(dream);
    } else {
      setModalVisible(false);
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="nights-stay" size={80} color={theme.colors.primary} />
      <Text style={styles.emptyTitle}>لا توجد أحلام بعد</Text>
      <Text style={styles.emptySubtitle}>ابدأ بتسجيل حلمك الأول ✨</Text>
      <Pressable 
        style={styles.emptyButton}
        onPress={() => router.push('/(tabs)/add')}
      >
        <MaterialIcons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>إضافة حلم</Text>
      </Pressable>
    </View>
  );

  const displayDreams = filteredDreams;
  const hasActiveFilters = searchQuery.trim() !== '' || dateFilter !== 'all';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>DreamRecall</Text>
          <Text style={styles.subtitle}>
            {hasActiveFilters
              ? `${displayDreams.length} من ${dreams.length} حلم`
              : `${dreams.length} حلم مسجل`}
          </Text>
        </View>
        <MaterialIcons name="nightlight-round" size={32} color={theme.colors.primary} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color={theme.colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث في الأحلام..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <MaterialIcons name="clear" size={20} color={theme.colors.textTertiary} />
            </Pressable>
          )}
        </View>

        <View style={styles.filterContainer}>
          {DATE_FILTERS.map((filter) => (
            <Pressable
              key={filter.value}
              style={[
                styles.filterButton,
                dateFilter === filter.value && styles.filterButtonActive,
              ]}
              onPress={() => setDateFilter(filter.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  dateFilter === filter.value && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={displayDreams}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <DreamCard dream={item} onPress={() => handleDreamPress(item)} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading && !searching ? renderEmpty : null}
        onRefresh={refresh}
        refreshing={loading || searching}
        showsVerticalScrollIndicator={false}
      />

      <DreamModal
        visible={modalVisible}
        dream={selectedDream}
        onClose={() => setModalVisible(false)}
        onNext={handleNext}
        showNext
      />
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
  subtitle: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textTertiary,
    marginTop: 4,
  },
  list: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    minHeight: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(106, 0, 255, 0.2)',
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
    color: '#FFFFFF',
  },
});
