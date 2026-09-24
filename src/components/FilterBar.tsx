import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  useColorScheme,
} from 'react-native';
import type { InventoryStatus } from '../models/InventoryStatus';
import { INVENTORY_STATUSES } from '../models/InventoryStatus';

interface Props {
  status: InventoryStatus | null;
  category: string | null;
  binLocation: string | null;
  categories: string[];
  binLocations: string[];
  onStatusChange: (s: InventoryStatus | null) => void;
  onCategoryChange: (c: string | null) => void;
  onBinChange: (b: string | null) => void;
  onClear: () => void;
}

type FilterType = 'status' | 'category' | 'bin';

export function FilterBar({
  status,
  category,
  binLocation,
  categories,
  binLocations,
  onStatusChange,
  onCategoryChange,
  onBinChange,
  onClear,
}: Props) {
  const isDark = useColorScheme() === 'dark';
  const [modalType, setModalType] = useState<FilterType | null>(null);
  const hasFilters = status || category || binLocation;

  const getOptions = (): string[] => {
    if (modalType === 'status') return [...INVENTORY_STATUSES];
    if (modalType === 'category') return categories;
    if (modalType === 'bin') return binLocations;
    return [];
  };

  const getCurrent = (): string | null => {
    if (modalType === 'status') return status;
    if (modalType === 'category') return category;
    if (modalType === 'bin') return binLocation;
    return null;
  };

  const onSelect = (value: string | null) => {
    if (modalType === 'status') onStatusChange(value as InventoryStatus | null);
    else if (modalType === 'category') onCategoryChange(value);
    else if (modalType === 'bin') onBinChange(value);
    setModalType(null);
  };

  const chip = (label: string, active: boolean, onPress: () => void) => (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: active ? '#3B82F6' : isDark ? '#1e1e2e' : '#F3F4F6',
          borderColor: active ? '#3B82F6' : isDark ? '#374151' : '#E5E7EB',
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? '#fff' : isDark ? '#D1D5DB' : '#374151' },
        ]}
      >
        {label} ▼
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {chip(status ?? 'Status', !!status, () => setModalType('status'))}
        {chip(category ?? 'Category', !!category, () => setModalType('category'))}
        {chip(binLocation ?? 'Bin', !!binLocation, () => setModalType('bin'))}
        {hasFilters && (
          <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      <Modal visible={!!modalType} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalType(null)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? '#1e1e2e' : '#fff' },
            ]}
          >
            <Text
              style={[styles.modalTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}
            >
              Select {modalType}
            </Text>
            <TouchableOpacity style={styles.option} onPress={() => onSelect(null)}>
              <Text
                style={[
                  styles.optionText,
                  {
                    color: !getCurrent() ? '#3B82F6' : isDark ? '#D1D5DB' : '#374151',
                    fontWeight: !getCurrent() ? '700' : '400',
                  },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <FlatList
              data={getOptions()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.option} onPress={() => onSelect(item)}>
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          getCurrent() === item
                            ? '#3B82F6'
                            : isDark
                              ? '#D1D5DB'
                              : '#374151',
                        fontWeight: getCurrent() === item ? '700' : '400',
                      },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 300 }}
            />
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalType(null)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  clearText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  option: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  optionText: { fontSize: 16 },
  cancelBtn: { marginTop: 16, alignItems: 'center', padding: 12 },
  cancelText: { color: '#6B7280', fontWeight: '600', fontSize: 16 },
});
