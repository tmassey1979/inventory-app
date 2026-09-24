import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import type { InventoryStatusHistory } from '../models/InventoryStatusHistory';
import { STATUS_COLORS } from '../models/InventoryStatus';
import { formatDateTime } from '../utils/dates';

interface Props {
  history: InventoryStatusHistory[];
}

export function StatusTimeline({ history }: Props) {
  const isDark = useColorScheme() === 'dark';
  if (history.length === 0) {
    return (
      <Text style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>
        No status history
      </Text>
    );
  }
  return (
    <View style={styles.container}>
      {history.map((entry, index) => {
        const color = STATUS_COLORS[entry.status] ?? '#6B7280';
        const isLast = index === history.length - 1;
        return (
          <View key={entry.id} style={styles.row}>
            <View style={styles.left}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
                  ]}
                />
              )}
            </View>
            <View style={styles.content}>
              <Text style={[styles.status, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                {entry.status}
              </Text>
              <Text style={[styles.date, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                {formatDateTime(entry.changed_at)}
              </Text>
              {entry.notes ? (
                <Text style={[styles.notes, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  {entry.notes}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingLeft: 4 },
  row: { flexDirection: 'row', minHeight: 56 },
  left: { width: 24, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  line: { width: 2, flex: 1, marginTop: 4 },
  content: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
  status: { fontSize: 15, fontWeight: '700' },
  date: { fontSize: 13, marginTop: 2 },
  notes: { fontSize: 13, fontStyle: 'italic', marginTop: 4 },
});
