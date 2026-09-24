import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { InventoryStatus } from '../models/InventoryStatus';
import { STATUS_COLORS } from '../models/InventoryStatus';

interface Props {
  status: InventoryStatus;
  size?: 'small' | 'medium';
}

export function StatusBadge({ status, size = 'medium' }: Props) {
  const color = STATUS_COLORS[status] ?? '#6B7280';
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color + '22', borderColor: color },
        size === 'small' && styles.small,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        style={[styles.text, { color }, size === 'small' && styles.smallText]}
      >
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  small: { paddingHorizontal: 6, paddingVertical: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  text: { fontSize: 13, fontWeight: '600' },
  smallText: { fontSize: 11 },
});
