import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  useColorScheme,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useInventory } from '../../src/hooks/useInventory';
import { SwipeableInventoryCard } from '../../src/components/SwipeableInventoryCard';
import { SearchBar } from '../../src/components/SearchBar';
import { FilterBar } from '../../src/components/FilterBar';
import type { InventoryStatus } from '../../src/models/InventoryStatus';
import { isValidStatus } from '../../src/models/InventoryStatus';
import { hapticLight } from '../../src/utils/haptics';
import {
  loadInventoryFilters,
  saveInventoryFilters,
} from '../../src/utils/preferences';

export default function InventoryListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string }>();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [prefsReady, setPrefsReady] = useState(false);
  const {
    items,
    loading,
    error,
    filters,
    categories,
    binLocations,
    refresh,
    updateFilters,
    clearFilters,
  } = useInventory();

  useEffect(() => {
    (async () => {
      const saved = await loadInventoryFilters();
      if (Object.keys(saved).length) {
        updateFilters(saved);
      }
      setPrefsReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!prefsReady) return;
    if (params.status && isValidStatus(params.status)) {
      updateFilters({ status: params.status });
    }
  }, [params.status, prefsReady]);

  useEffect(() => {
    if (!prefsReady) return;
    saveInventoryFilters({
      status: filters.status,
      category: filters.category,
      bin_location: filters.bin_location,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }).catch(() => {});
  }, [
    filters.status,
    filters.category,
    filters.bin_location,
    filters.sortBy,
    filters.sortOrder,
    prefsReady,
  ]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleSearch = (text: string) => {
    setSearchText(text);
    updateFilters({ search: text || undefined });
  };

  const hasActiveFilters = !!(
    filters.search ||
    filters.status ||
    filters.category ||
    filters.bin_location
  );

  const emptyTitle = hasActiveFilters
    ? filters.status === 'Packed'
      ? 'Nothing to ship'
      : 'No matching items'
    : 'No inventory yet';

  const emptyBody = hasActiveFilters
    ? filters.status === 'Packed'
      ? 'Mark sold items as Packed when they are ready to leave the warehouse.'
      : 'Try adjusting your filters or clear them to see everything.'
    : 'Add your first item — inventory numbers are assigned automatically.';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? '#0f0f1a' : '#F9FAFB' },
        ]}
      >
        <View style={styles.header}>
          <SearchBar value={searchText} onChangeText={handleSearch} />
          <FilterBar
            status={(filters.status as InventoryStatus) ?? null}
            category={filters.category ?? null}
            binLocation={filters.bin_location ?? null}
            categories={categories}
            binLocations={binLocations}
            onStatusChange={(s) => updateFilters({ status: s })}
            onCategoryChange={(c) => updateFilters({ category: c })}
            onBinChange={(b) => updateFilters({ bin_location: b })}
            onClear={() => {
              setSearchText('');
              clearFilters();
            }}
          />
          <Text style={[styles.hint, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
            Swipe left for quick status · Filters are remembered
          </Text>
        </View>
        {loading && items.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={{ color: '#EF4444' }}>{error}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={refresh}>
              <Text style={styles.addBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>
              {filters.status === 'Packed' ? '📦' : '📭'}
            </Text>
            <Text
              style={[
                styles.emptyTitle,
                { color: isDark ? '#F9FAFB' : '#111827' },
              ]}
            >
              {emptyTitle}
            </Text>
            <Text
              style={{
                color: isDark ? '#9CA3AF' : '#6B7280',
                marginBottom: 16,
                textAlign: 'center',
                paddingHorizontal: 12,
              }}
            >
              {emptyBody}
            </Text>
            {hasActiveFilters ? (
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: '#6B7280' }]}
                onPress={() => {
                  setSearchText('');
                  clearFilters();
                }}
              >
                <Text style={styles.addBtnText}>Clear filters</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => {
                  hapticLight();
                  router.push('/inventory/add');
                }}
              >
                <Text style={styles.addBtnText}>+ Add Item</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <SwipeableInventoryCard
                item={item}
                onPress={() => router.push(`/inventory/${item.id}`)}
                onStatusChanged={refresh}
              />
            )}
            contentContainerStyle={{
              padding: 12,
              paddingBottom: insets.bottom + 24,
            }}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={refresh} />
            }
            initialNumToRender={15}
            maxToRenderPerBatch={20}
            windowSize={10}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 12, paddingTop: 8 },
  hint: { fontSize: 12, marginTop: 4, marginBottom: 4, marginLeft: 4 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  addBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
