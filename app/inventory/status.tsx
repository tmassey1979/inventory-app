import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getInventoryItem, updateInventoryStatus } from '../../src/db/inventoryRepository';
import { formatInventoryNumber } from '../../src/utils/inventoryNumber';
import {
  INVENTORY_STATUSES,
  STATUS_COLORS,
  type InventoryStatus,
} from '../../src/models/InventoryStatus';
import type { InventoryItem } from '../../src/models/InventoryItem';
import { StatusBadge } from '../../src/components/StatusBadge';

export default function ChangeStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = parseInt(id ?? '0', 10);
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [selected, setSelected] = useState<InventoryStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getInventoryItem(itemId);
        if (!data) {
          Alert.alert('Error', 'Item not found');
          router.back();
          return;
        }
        setItem(data);
        setSelected(data.status);
      } catch {
        Alert.alert('Error', 'Failed to load item');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [itemId]);

  const handleSave = async () => {
    if (!item || !selected) return;
    if (selected === item.status && !notes.trim()) {
      router.back();
      return;
    }
    setSaving(true);
    try {
      await updateInventoryStatus(item.id, selected, notes.trim() || null);
      router.back();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? '#0f0f1a' : '#F9FAFB' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#0f0f1a' : '#F9FAFB' }]}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
    >
      {item && (
        <>
          <Text style={{ color: isDark ? '#60A5FA' : '#2563EB', fontWeight: '800', fontSize: 16, marginBottom: 4 }}>
            #{formatInventoryNumber(item.inventory_number)} — {item.name}
          </Text>
          <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 16 }}>
            Current status:
          </Text>
          <StatusBadge status={item.status} />
        </>
      )}
      <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#374151', marginTop: 24 }]}>
        Change to:
      </Text>
      {INVENTORY_STATUSES.map((s) => {
        const color = STATUS_COLORS[s];
        const isSelected = selected === s;
        return (
          <TouchableOpacity
            key={s}
            style={[
              styles.statusOption,
              {
                backgroundColor: isSelected ? color + '22' : isDark ? '#1e1e2e' : '#fff',
                borderColor: isSelected ? color : isDark ? '#374151' : '#E5E7EB',
              },
            ]}
            onPress={() => setSelected(s)}
          >
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text
              style={{
                color: isDark ? '#F9FAFB' : '#111827',
                fontWeight: isSelected ? '700' : '500',
                fontSize: 16,
                flex: 1,
              }}
            >
              {s}
            </Text>
            {isSelected && <Text style={{ color, fontWeight: '700' }}>✓</Text>}
          </TouchableOpacity>
        );
      })}
      <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#374151', marginTop: 20 }]}>
        Notes (optional)
      </Text>
      <TextInput
        style={[
          styles.notesInput,
          {
            backgroundColor: isDark ? '#1e1e2e' : '#fff',
            borderColor: isDark ? '#374151' : '#E5E7EB',
            color: isDark ? '#F9FAFB' : '#111827',
          },
        ]}
        value={notes}
        onChangeText={setNotes}
        placeholder='e.g. "Listed on eBay"'
        placeholderTextColor="#9CA3AF"
        multiline
      />
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} disabled={saving}>
          <Text style={{ color: '#6B7280', fontWeight: '600', fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Save Status</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    marginBottom: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 28 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 14 },
  saveBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    minWidth: 140,
    alignItems: 'center',
  },
});
