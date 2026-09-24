import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInventoryItem } from '../../src/hooks/useInventoryItem';
import { StatusBadge } from '../../src/components/StatusBadge';
import { StatusTimeline } from '../../src/components/StatusTimeline';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { formatInventoryNumber } from '../../src/utils/inventoryNumber';
import { formatCurrency } from '../../src/utils/currency';
import { formatDateTime } from '../../src/utils/dates';
import {
  deleteInventoryItem,
  updateInventoryItem,
} from '../../src/db/inventoryRepository';
import {
  replaceInventoryPhoto,
  deleteInventoryPhoto,
} from '../../src/services/imageStorage';
import * as ImagePicker from 'expo-image-picker';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = parseInt(id ?? '0', 10);
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const { item, history, loading, error, refresh } = useInventoryItem(itemId);
  const [showDelete, setShowDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleDelete = async () => {
    setShowDelete(false);
    setBusy(true);
    try {
      await deleteInventoryItem(itemId);
      router.replace('/inventory');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const handleReplacePhoto = async () => {
    if (!item) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Photo library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;
    setBusy(true);
    try {
      const newUri = await replaceInventoryPhoto(
        result.assets[0].uri,
        item.inventory_number,
        item.photo_uri
      );
      await updateInventoryItem(item.id, { photo_uri: newUri });
      refresh();
    } catch {
      Alert.alert('Error', 'Failed to replace photo');
    } finally {
      setBusy(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!item?.photo_uri) return;
    Alert.alert('Remove Photo', 'Remove the photo from this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await deleteInventoryPhoto(item.photo_uri!);
            await updateInventoryItem(item.id, { photo_uri: null });
            refresh();
          } catch {
            Alert.alert('Error', 'Failed to remove photo');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  if (loading && !item) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? '#0f0f1a' : '#F9FAFB' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? '#0f0f1a' : '#F9FAFB' }]}>
        <Text style={{ color: '#EF4444' }}>{error ?? 'Item not found'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#3B82F6' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const textPrimary = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#0f0f1a' : '#F9FAFB' }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
    >
      <View style={styles.photoWrap}>
        {item.photo_uri ? (
          <Image source={{ uri: item.photo_uri }} style={styles.photo} />
        ) : (
          <View
            style={[
              styles.photoPlaceholder,
              { backgroundColor: isDark ? '#1e1e2e' : '#E5E7EB' },
            ]}
          >
            <Text style={{ fontSize: 64 }}>📦</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={[styles.invNumber, { color: isDark ? '#60A5FA' : '#2563EB' }]}>
          {formatInventoryNumber(item.inventory_number)}
        </Text>
        <Text style={[styles.name, { color: textPrimary }]}>{item.name}</Text>
        <View style={styles.metaRow}>
          {item.bin_location ? (
            <Text style={{ color: textSecondary, fontSize: 15 }}>📍 {item.bin_location}</Text>
          ) : null}
          <StatusBadge status={item.status} />
        </View>
        <View
          style={[
            styles.financeCard,
            {
              backgroundColor: isDark ? '#1e1e2e' : '#fff',
              borderColor: isDark ? '#374151' : '#E5E7EB',
            },
          ]}
        >
          <View style={styles.financeRow}>
            <Text style={{ color: textSecondary }}>Purchase Cost</Text>
            <Text style={{ color: textPrimary, fontWeight: '600' }}>
              {formatCurrency(item.purchase_cost)}
            </Text>
          </View>
          <View style={styles.financeRow}>
            <Text style={{ color: textSecondary }}>Listing Price</Text>
            <Text style={{ color: textPrimary, fontWeight: '600' }}>
              {formatCurrency(item.listing_price)}
            </Text>
          </View>
          <View style={styles.financeRow}>
            <Text style={{ color: textSecondary }}>Sale Price</Text>
            <Text style={{ color: textPrimary, fontWeight: '600' }}>
              {formatCurrency(item.sale_price)}
            </Text>
          </View>
        </View>
        {item.description ? (
          <>
            <Text style={[styles.sectionLabel, { color: textSecondary }]}>Description</Text>
            <Text style={{ color: textPrimary, fontSize: 15, lineHeight: 22 }}>
              {item.description}
            </Text>
          </>
        ) : null}
        {item.category ? (
          <>
            <Text style={[styles.sectionLabel, { color: textSecondary }]}>Category</Text>
            <Text style={{ color: textPrimary, fontSize: 15 }}>{item.category}</Text>
          </>
        ) : null}
        <Text style={[styles.sectionLabel, { color: textSecondary }]}>Created</Text>
        <Text style={{ color: textPrimary, fontSize: 14 }}>{formatDateTime(item.created_at)}</Text>
        <Text style={[styles.sectionLabel, { color: textSecondary }]}>Updated</Text>
        <Text style={{ color: textPrimary, fontSize: 14 }}>{formatDateTime(item.updated_at)}</Text>
        <Text style={[styles.sectionLabel, { color: textSecondary, marginTop: 24 }]}>
          Status History
        </Text>
        <StatusTimeline history={history} />
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
            onPress={() => router.push(`/inventory/edit?id=${item.id}`)}
            disabled={busy}
          >
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]}
            onPress={() => router.push(`/inventory/status?id=${item.id}`)}
            disabled={busy}
          >
            <Text style={styles.actionText}>Change Status</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#06B6D4' }]}
            onPress={handleReplacePhoto}
            disabled={busy}
          >
            <Text style={styles.actionText}>
              {item.photo_uri ? 'Replace Photo' : 'Add Photo'}
            </Text>
          </TouchableOpacity>
          {item.photo_uri ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#6B7280' }]}
              onPress={handleRemovePhoto}
              disabled={busy}
            >
              <Text style={styles.actionText}>Remove Photo</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
            onPress={() => setShowDelete(true)}
            disabled={busy}
          >
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ConfirmDialog
        visible={showDelete}
        title={`Delete inventory item ${formatInventoryNumber(item.inventory_number)}?`}
        message="This will permanently delete the item, its status history, and associated photo."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoWrap: { width: '100%', height: 280 },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: { padding: 16 },
  invNumber: { fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  name: { fontSize: 24, fontWeight: '700', marginTop: 4, marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  financeCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
  financeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 4,
  },
  actions: { marginTop: 28, gap: 10 },
  actionBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
