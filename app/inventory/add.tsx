import React, { useState } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhotoPicker } from '../../src/components/PhotoPicker';
import {
  createInventoryItem,
  updateInventoryItem,
  addPhotoForItem,
} from '../../src/db/inventoryRepository';
import { saveInventoryPhoto } from '../../src/services/imageStorage';
import { formatInventoryNumber } from '../../src/utils/inventoryNumber';
import { parseCurrency } from '../../src/utils/currency';
import type { InventoryStatus } from '../../src/models/InventoryStatus';
import { INVENTORY_STATUSES } from '../../src/models/InventoryStatus';
import { MARKETPLACE_PLATFORMS } from '../../src/models/InventoryItem';
import { hapticSuccess } from '../../src/utils/haptics';

export default function AddItemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ barcode?: string }>();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [binLocation, setBinLocation] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [fees, setFees] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [barcode, setBarcode] = useState(params.barcode ?? '');
  const [platform, setPlatform] = useState<string | null>(null);
  const [marketplaceUrl, setMarketplaceUrl] = useState('');
  const [status, setStatus] = useState<InventoryStatus>('Added');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('');
    setBinLocation('');
    setPurchaseCost('');
    setListingPrice('');
    setSalePrice('');
    setFees('');
    setShippingCost('');
    setBarcode('');
    setPlatform(null);
    setMarketplaceUrl('');
    setStatus('Added');
    setPhotoUri(null);
  };

  const handleSave = async (addAnother: boolean) => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }
    const cost = parseCurrency(purchaseCost);
    const listPrice = parseCurrency(listingPrice);
    const soldPrice = parseCurrency(salePrice);
    const feesVal = parseCurrency(fees);
    const shipVal = parseCurrency(shippingCost);
    if (purchaseCost && cost === null) {
      Alert.alert('Validation', 'Purchase cost must be a valid number >= 0.');
      return;
    }
    if (listingPrice && listPrice === null) {
      Alert.alert('Validation', 'Listing price must be a valid number >= 0.');
      return;
    }
    if (salePrice && soldPrice === null) {
      Alert.alert('Validation', 'Sale price must be a valid number >= 0.');
      return;
    }
    if (fees && feesVal === null) {
      Alert.alert('Validation', 'Fees must be a valid number >= 0.');
      return;
    }
    if (shippingCost && shipVal === null) {
      Alert.alert('Validation', 'Shipping cost must be a valid number >= 0.');
      return;
    }

    setSaving(true);
    try {
      const item = await createInventoryItem({
        name: name.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        bin_location: binLocation.trim() || null,
        status,
        purchase_cost: cost,
        listing_price: listPrice,
        sale_price: soldPrice,
        fees: feesVal,
        shipping_cost: shipVal,
        barcode: barcode.trim() || null,
        marketplace_platform: platform,
        marketplace_url: marketplaceUrl.trim() || null,
        photo_uri: null,
      });

      if (photoUri) {
        try {
          const finalPhotoUri = await saveInventoryPhoto(
            photoUri,
            item.inventory_number
          );
          await updateInventoryItem(item.id, { photo_uri: finalPhotoUri });
          await addPhotoForItem(item.id, finalPhotoUri);
        } catch (photoErr) {
          console.warn('Photo save failed:', photoErr);
        }
      }

      await hapticSuccess();
      Alert.alert(
        'Success',
        `Inventory #${formatInventoryNumber(item.inventory_number)} created`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (addAnother) resetForm();
              else router.replace(`/inventory/${item.id}`);
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'Failed to create item'
      );
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: isDark ? '#1e1e2e' : '#fff',
      borderColor: isDark ? '#374151' : '#E5E7EB',
      color: isDark ? '#F9FAFB' : '#111827',
    },
  ];
  const labelStyle = [styles.label, { color: isDark ? '#D1D5DB' : '#374151' }];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: isDark ? '#0f0f1a' : '#F9FAFB' },
        ]}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <PhotoPicker
          photoUri={photoUri}
          onPhotoSelected={setPhotoUri}
          onPhotoRemoved={() => setPhotoUri(null)}
          size={180}
        />
        <Text style={labelStyle}>Name *</Text>
        <TextInput
          style={inputStyle}
          value={name}
          onChangeText={setName}
          placeholder="Item name"
          placeholderTextColor="#9CA3AF"
        />
        <Text style={labelStyle}>Description</Text>
        <TextInput
          style={[inputStyle, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Optional description"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
        />
        <Text style={labelStyle}>Category</Text>
        <TextInput
          style={inputStyle}
          value={category}
          onChangeText={setCategory}
          placeholder="e.g. Electronics, Kitchen"
          placeholderTextColor="#9CA3AF"
        />
        <Text style={labelStyle}>Bin Location</Text>
        <TextInput
          style={inputStyle}
          value={binLocation}
          onChangeText={setBinLocation}
          placeholder="e.g. A-01, Shelf-2"
          placeholderTextColor="#9CA3AF"
        />
        <Text style={labelStyle}>Barcode</Text>
        <View style={styles.row}>
          <TextInput
            style={[inputStyle, { flex: 1 }]}
            value={barcode}
            onChangeText={setBarcode}
            placeholder="UPC / EAN / QR payload"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => router.push('/tools/scan')}
          >
            <Text style={styles.scanBtnText}>Scan</Text>
          </TouchableOpacity>
        </View>

        <Text style={labelStyle}>Purchase Cost</Text>
        <TextInput
          style={inputStyle}
          value={purchaseCost}
          onChangeText={setPurchaseCost}
          placeholder="0.00"
          placeholderTextColor="#9CA3AF"
          keyboardType="decimal-pad"
        />
        <Text style={labelStyle}>Listing Price</Text>
        <TextInput
          style={inputStyle}
          value={listingPrice}
          onChangeText={setListingPrice}
          placeholder="0.00"
          placeholderTextColor="#9CA3AF"
          keyboardType="decimal-pad"
        />
        <Text style={labelStyle}>Sale Price</Text>
        <TextInput
          style={inputStyle}
          value={salePrice}
          onChangeText={setSalePrice}
          placeholder="0.00"
          placeholderTextColor="#9CA3AF"
          keyboardType="decimal-pad"
        />
        <Text style={labelStyle}>Fees (marketplace / payment)</Text>
        <TextInput
          style={inputStyle}
          value={fees}
          onChangeText={setFees}
          placeholder="0.00"
          placeholderTextColor="#9CA3AF"
          keyboardType="decimal-pad"
        />
        <Text style={labelStyle}>Shipping cost (you paid)</Text>
        <TextInput
          style={inputStyle}
          value={shippingCost}
          onChangeText={setShippingCost}
          placeholder="0.00"
          placeholderTextColor="#9CA3AF"
          keyboardType="decimal-pad"
        />

        <Text style={labelStyle}>Marketplace</Text>
        <View style={styles.statusRow}>
          {MARKETPLACE_PLATFORMS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.statusChip,
                {
                  backgroundColor:
                    platform === p ? '#3B82F6' : isDark ? '#1e1e2e' : '#F3F4F6',
                  borderColor:
                    platform === p ? '#3B82F6' : isDark ? '#374151' : '#E5E7EB',
                },
              ]}
              onPress={() => setPlatform(platform === p ? null : p)}
            >
              <Text
                style={{
                  color:
                    platform === p ? '#fff' : isDark ? '#D1D5DB' : '#374151',
                  fontWeight: '600',
                  fontSize: 12,
                }}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={labelStyle}>Listing URL</Text>
        <TextInput
          style={inputStyle}
          value={marketplaceUrl}
          onChangeText={setMarketplaceUrl}
          placeholder="https://..."
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text style={labelStyle}>Status</Text>
        <View style={styles.statusRow}>
          {INVENTORY_STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.statusChip,
                {
                  backgroundColor:
                    status === s ? '#3B82F6' : isDark ? '#1e1e2e' : '#F3F4F6',
                  borderColor:
                    status === s ? '#3B82F6' : isDark ? '#374151' : '#E5E7EB',
                },
              ]}
              onPress={() => setStatus(s)}
            >
              <Text
                style={{
                  color: status === s ? '#fff' : isDark ? '#D1D5DB' : '#374151',
                  fontWeight: '600',
                  fontSize: 12,
                }}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.cancelBtn]}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.secondaryBtn]}
            onPress={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#3B82F6" />
            ) : (
              <Text style={styles.secondaryText}>Save & Add Another</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.primaryBtn]}
            onPress={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  scanBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  scanBtnText: { color: '#fff', fontWeight: '700' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 28,
    justifyContent: 'flex-end',
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  cancelBtn: {},
  cancelText: { color: '#6B7280', fontWeight: '600', fontSize: 15 },
  secondaryBtn: { borderWidth: 1, borderColor: '#3B82F6' },
  secondaryText: { color: '#3B82F6', fontWeight: '600', fontSize: 15 },
  primaryBtn: { backgroundColor: '#3B82F6' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
