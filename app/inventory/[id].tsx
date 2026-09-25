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
  Linking,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useInventoryItem } from '../../src/hooks/useInventoryItem';
import { StatusBadge } from '../../src/components/StatusBadge';
import { StatusTimeline } from '../../src/components/StatusTimeline';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { formatInventoryNumber } from '../../src/utils/inventoryNumber';
import { formatCurrency } from '../../src/utils/currency';
import { formatDateTime } from '../../src/utils/dates';
import { computeNetProfit } from '../../src/models/InventoryItem';
import {
  deleteInventoryItem,
  updateInventoryItem,
  addPhotoForItem,
  removePhoto,
} from '../../src/db/inventoryRepository';
import {
  saveInventoryPhoto,
  saveShippingLabel,
  deleteShippingLabel,
} from '../../src/services/imageStorage';
import {
  printPackingSlip,
  printShippingLabel,
} from '../../src/services/printService';
import { hapticLight, hapticSuccess, hapticWarning } from '../../src/utils/haptics';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = parseInt(id ?? '0', 10);
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const { item, history, photos, loading, error, refresh } =
    useInventoryItem(itemId);
  const [showDelete, setShowDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const textPrimary = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const cardBg = isDark ? '#1e1e2e' : '#fff';
  const border = isDark ? '#374151' : '#E5E7EB';

  const handleDelete = async () => {
    setShowDelete(false);
    setBusy(true);
    try {
      await deleteInventoryItem(itemId);
      await hapticWarning();
      router.replace('/inventory');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const pickImage = async (fromCamera: boolean) => {
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required.');
        return null;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.9,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (result.canceled || !result.assets[0]) return null;
      return result.assets[0].uri;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  };

  const handleAddPhoto = () => {
    if (!item) return;
    Alert.alert('Add photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const uri = await pickImage(true);
          if (!uri) return;
          setBusy(true);
          try {
            const saved = await saveInventoryPhoto(uri, item.inventory_number);
            await addPhotoForItem(item.id, saved);
            if (!item.photo_uri) {
              await updateInventoryItem(item.id, { photo_uri: saved });
            }
            await hapticSuccess();
            refresh();
          } catch {
            Alert.alert('Error', 'Failed to add photo');
          } finally {
            setBusy(false);
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const uri = await pickImage(false);
          if (!uri) return;
          setBusy(true);
          try {
            const saved = await saveInventoryPhoto(uri, item.inventory_number);
            await addPhotoForItem(item.id, saved);
            if (!item.photo_uri) {
              await updateInventoryItem(item.id, { photo_uri: saved });
            }
            await hapticSuccess();
            refresh();
          } catch {
            Alert.alert('Error', 'Failed to add photo');
          } finally {
            setBusy(false);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemoveExtraPhoto = (photoId: number) => {
    Alert.alert('Remove photo', 'Delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await removePhoto(photoId);
            await hapticLight();
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

  const handleAttachLabel = () => {
    if (!item) return;
    Alert.alert('Shipping label', 'Attach a label image', [
      {
        text: 'Camera',
        onPress: async () => {
          const uri = await pickImage(true);
          if (!uri) return;
          setBusy(true);
          try {
            if (item.shipping_label_uri) {
              await deleteShippingLabel(item.shipping_label_uri);
            }
            const saved = await saveShippingLabel(uri, item.inventory_number);
            await updateInventoryItem(item.id, { shipping_label_uri: saved });
            await hapticSuccess();
            refresh();
          } catch {
            Alert.alert('Error', 'Failed to attach label');
          } finally {
            setBusy(false);
          }
        },
      },
      {
        text: 'Gallery / Files',
        onPress: async () => {
          const uri = await pickImage(false);
          if (!uri) return;
          setBusy(true);
          try {
            if (item.shipping_label_uri) {
              await deleteShippingLabel(item.shipping_label_uri);
            }
            const saved = await saveShippingLabel(uri, item.inventory_number);
            await updateInventoryItem(item.id, { shipping_label_uri: saved });
            await hapticSuccess();
            refresh();
          } catch {
            Alert.alert('Error', 'Failed to attach label');
          } finally {
            setBusy(false);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemoveLabel = () => {
    if (!item?.shipping_label_uri) return;
    Alert.alert('Remove label', 'Detach the shipping label?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await deleteShippingLabel(item.shipping_label_uri);
            await updateInventoryItem(item.id, { shipping_label_uri: null });
            refresh();
          } catch {
            Alert.alert('Error', 'Failed to remove label');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  if (loading && !item) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: isDark ? '#0f0f1a' : '#F9FAFB' },
        ]}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: isDark ? '#0f0f1a' : '#F9FAFB' },
        ]}
      >
        <Text style={{ color: '#EF4444' }}>{error ?? 'Item not found'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#3B82F6' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const net = computeNetProfit(item);
  const primaryUri = photos[0]?.uri ?? item.photo_uri;

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#0f0f1a' : '#F9FAFB' },
      ]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
    >
      <View style={styles.photoWrap}>
        {primaryUri ? (
          <Image source={{ uri: primaryUri }} style={styles.photo} />
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

      {photos.length > 0 ? (
        <FlatList
          horizontal
          data={photos}
          keyExtractor={(p) => String(p.id)}
          style={styles.gallery}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
          renderItem={({ item: p }) => (
            <TouchableOpacity
              onLongPress={() => handleRemoveExtraPhoto(p.id)}
              delayLongPress={400}
            >
              <Image source={{ uri: p.uri }} style={styles.galleryThumb} />
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <TouchableOpacity
              style={[styles.galleryAdd, { borderColor: border }]}
              onPress={handleAddPhoto}
            >
              <Text style={{ color: '#3B82F6', fontWeight: '700' }}>+</Text>
            </TouchableOpacity>
          }
          showsHorizontalScrollIndicator={false}
        />
      ) : null}

      <View style={styles.body}>
        <Text style={[styles.invNumber, { color: isDark ? '#60A5FA' : '#2563EB' }]}>
          {formatInventoryNumber(item.inventory_number)}
        </Text>
        <Text style={[styles.name, { color: textPrimary }]}>{item.name}</Text>
        <View style={styles.metaRow}>
          {item.bin_location ? (
            <Text style={{ color: textSecondary, fontSize: 15 }}>
              📍 {item.bin_location}
            </Text>
          ) : null}
          <StatusBadge status={item.status} />
        </View>

        <View style={[styles.financeCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={styles.financeRow}>
            <Text style={{ color: textSecondary }}>Purchase</Text>
            <Text style={{ color: textPrimary, fontWeight: '600' }}>
              {formatCurrency(item.purchase_cost)}
            </Text>
          </View>
          <View style={styles.financeRow}>
            <Text style={{ color: textSecondary }}>Listed</Text>
            <Text style={{ color: textPrimary, fontWeight: '600' }}>
              {formatCurrency(item.listing_price)}
            </Text>
          </View>
          <View style={styles.financeRow}>
            <Text style={{ color: textSecondary }}>Sale</Text>
            <Text style={{ color: textPrimary, fontWeight: '600' }}>
              {formatCurrency(item.sale_price)}
            </Text>
          </View>
          <View style={styles.financeRow}>
            <Text style={{ color: textSecondary }}>Fees</Text>
            <Text style={{ color: textPrimary, fontWeight: '600' }}>
              {formatCurrency(item.fees)}
            </Text>
          </View>
          <View style={styles.financeRow}>
            <Text style={{ color: textSecondary }}>Shipping cost</Text>
            <Text style={{ color: textPrimary, fontWeight: '600' }}>
              {formatCurrency(item.shipping_cost)}
            </Text>
          </View>
          <View style={[styles.financeRow, styles.financeTotal]}>
            <Text style={{ color: textPrimary, fontWeight: '700' }}>Net profit</Text>
            <Text
              style={{
                color: (net ?? 0) >= 0 ? '#10B981' : '#EF4444',
                fontWeight: '800',
              }}
            >
              {formatCurrency(net)}
            </Text>
          </View>
        </View>

        {item.marketplace_platform || item.marketplace_url ? (
          <View style={[styles.financeCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.sectionLabel, { color: textSecondary, marginTop: 0 }]}>
              Marketplace
            </Text>
            {item.marketplace_platform ? (
              <Text style={{ color: textPrimary, fontWeight: '600' }}>
                {item.marketplace_platform}
              </Text>
            ) : null}
            {item.marketplace_url ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(item.marketplace_url!)}
              >
                <Text style={{ color: '#3B82F6', marginTop: 4 }} numberOfLines={2}>
                  {item.marketplace_url}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {item.barcode ? (
          <>
            <Text style={[styles.sectionLabel, { color: textSecondary }]}>Barcode</Text>
            <Text style={{ color: textPrimary, fontSize: 15 }}>{item.barcode}</Text>
          </>
        ) : null}

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

        <Text style={[styles.sectionLabel, { color: textSecondary }]}>Shipping label</Text>
        {item.shipping_label_uri ? (
          <View>
            <Image
              source={{ uri: item.shipping_label_uri }}
              style={styles.labelPreview}
              resizeMode="contain"
            />
            <View style={styles.labelActions}>
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: '#8B5CF6' }]}
                onPress={async () => {
                  try {
                    await printShippingLabel(item);
                    await hapticSuccess();
                  } catch (e) {
                    Alert.alert(
                      'Print failed',
                      e instanceof Error ? e.message : 'Could not print'
                    );
                  }
                }}
              >
                <Text style={styles.actionText}>Print label</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: '#6B7280' }]}
                onPress={handleAttachLabel}
              >
                <Text style={styles.actionText}>Replace</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: '#EF4444' }]}
                onPress={handleRemoveLabel}
              >
                <Text style={styles.actionText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: '#F59E0B', alignSelf: 'flex-start' }]}
            onPress={handleAttachLabel}
          >
            <Text style={styles.actionText}>Attach shipping label</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.sectionLabel, { color: textSecondary }]}>Created</Text>
        <Text style={{ color: textPrimary, fontSize: 14 }}>
          {formatDateTime(item.created_at)}
        </Text>
        <Text style={[styles.sectionLabel, { color: textSecondary }]}>Updated</Text>
        <Text style={{ color: textPrimary, fontSize: 14 }}>
          {formatDateTime(item.updated_at)}
        </Text>

        <Text style={[styles.sectionLabel, { color: textSecondary, marginTop: 24 }]}>
          Status History
        </Text>
        <StatusTimeline history={history} />

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
            onPress={() => {
              hapticLight();
              router.push(`/inventory/edit?id=${item.id}`);
            }}
            disabled={busy}
          >
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]}
            onPress={() => {
              hapticLight();
              router.push(`/inventory/status?id=${item.id}`);
            }}
            disabled={busy}
          >
            <Text style={styles.actionText}>Change Status</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}
            onPress={async () => {
              try {
                await printPackingSlip(item);
                await hapticSuccess();
              } catch (e) {
                Alert.alert(
                  'Print failed',
                  e instanceof Error ? e.message : 'Could not print'
                );
              }
            }}
            disabled={busy}
          >
            <Text style={styles.actionText}>Print packing slip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#06B6D4' }]}
            onPress={handleAddPhoto}
            disabled={busy}
          >
            <Text style={styles.actionText}>Add photo</Text>
          </TouchableOpacity>
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
        message="This permanently deletes the item, history, photos, and shipping label."
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
  gallery: { maxHeight: 72, marginTop: 8 },
  galleryThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  galleryAdd: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: { padding: 16 },
  invNumber: { fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  name: { fontSize: 24, fontWeight: '700', marginTop: 4, marginBottom: 10 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  financeCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  financeTotal: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#374151',
    marginTop: 4,
    paddingTop: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 4,
  },
  labelPreview: {
    width: '100%',
    height: 160,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  labelActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  smallBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actions: { marginTop: 28, gap: 10 },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
