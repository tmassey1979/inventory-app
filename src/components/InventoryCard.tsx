import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import type { InventoryItem } from '../models/InventoryItem';
import { formatInventoryNumber } from '../utils/inventoryNumber';
import { StatusBadge } from './StatusBadge';

interface Props {
  item: InventoryItem;
  onPress: () => void;
}

export function InventoryCard({ item, onPress }: Props) {
  const isDark = useColorScheme() === 'dark';
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1e1e2e' : '#ffffff',
          borderColor: isDark ? '#374151' : '#E5E7EB',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.thumbContainer}>
        {item.photo_uri ? (
          <Image source={{ uri: item.photo_uri }} style={styles.thumb} />
        ) : (
          <View
            style={[
              styles.thumbPlaceholder,
              { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
            ]}
          >
            <Text style={styles.thumbIcon}>📦</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.number, { color: isDark ? '#60A5FA' : '#2563EB' }]}>
          {formatInventoryNumber(item.inventory_number)}
        </Text>
        <Text
          style={[styles.name, { color: isDark ? '#F9FAFB' : '#111827' }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <View style={styles.meta}>
          {item.bin_location ? (
            <Text style={[styles.bin, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              📍 {item.bin_location}
            </Text>
          ) : null}
          <StatusBadge status={item.status} size="small" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    alignItems: 'center',
  },
  thumbContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  thumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbIcon: { fontSize: 24 },
  info: { flex: 1 },
  number: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  bin: { fontSize: 13 },
});
