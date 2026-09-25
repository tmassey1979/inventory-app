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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhotoPicker } from '../../src/components/PhotoPicker';
import {
  getInventoryItem,
  updateInventoryItem,
} from '../../src/db/inventoryRepository';
import {
  saveInventoryPhoto,
  replaceInventoryPhoto,
  deleteInventoryPhoto,
} from '../../src/services/imageStorage';
import { formatInventoryNumber } from '../../src/utils/inventoryNumber';
import { parseCurrency } from '../../src/utils/currency';
import type { InventoryItem } from '../../src/models/InventoryItem';
import { MARKETPLACE_PLATFORMS } from '../../src/models/InventoryItem';
import { hapticSuccess } from '../../src/utils/haptics';

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = parseInt(id ?? '0', 10);
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [binLocation, setBinLocation] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [fees, setFees] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [barcode, setBarcode] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);
  const [marketplaceUrl, setMarketplaceUrl] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [originalPhotoUri, setOriginalPhotoUri] = useState<string | null>(null);
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
        setName(data.name);
        setDescription(data.description ?? '');
        setCategory(data.category ?? '');
        setBinLocation(data.bin_location ?? '');
        setPurchaseCost(
          data.purchase_cost != null ? String(data.purchase_cost) : ''
        );
        setListingPrice(
          data.listing_price != null ? String(data.listing_price) : ''
        );
        setSalePrice(data.sale_price != null ? String(data.sale_price) : '');
        setFees(data.fees != null ? String(data.fees) : '');
        setShippingCost(
          data.shipping_cost != null ? String(data.shipping_cost) : ''
        );
        setBarcode(data.barcode ?? '');
        setPlatform(data.marketplace_platform);
        setMarketplaceUrl(data.marketplace_url ?? '');
        setPhotoUri(data.photo_uri);
        setOriginalPhotoUri(data.photo_uri);
      } catch {
        Alert.alert('Error', 'Failed to load item');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [itemId]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }
    if (!item) return;
    const cost = parseCurrency(purchaseCost);
    const listPrice = parseCurrency(listingPrice);
    const soldPrice = parseCurrency(salePrice);
    const feesVal = parseCurrency(fees);
    const shipVal = parseCurrency(shippingCost);
    if (purchaseCost && cost === null) {
      Alert.alert('Validation', 'Purchase cost must be >= 0');
      return;
    }
    if (listingPrice && listPrice === null) {
      Alert.alert('Validation', 'Listing price must be >= 0');
      return;
    }
    if (salePrice && soldPrice === null) {
      Alert.alert('Validation', 'Sale price must be >= 0');
      return;
    }
    if (fees && feesVal === null) {
      Alert.alert('Validation', 'Fees must be >= 0');
      return;
    }
    if (shippingCost && shipVal === null) {
      Alert.alert('Validation', 'Shipping cost must be >= 0');
      return;
    }

    setSaving(true);
    try {
      let finalPhotoUri = photoUri;
      if (photoUri !== originalPhotoUri) {
        if (photoUri) {
          if (originalPhotoUri) {
            finalPhotoUri = await replaceInventoryPhoto(
              photoUri,
              item.inventory_number,
              originalPhotoUri
            );
          } else {
            finalPhotoUri = await saveInventoryPhoto(
              photoUri,
              item.inventory_number
            );
          }
        } else if (originalPhotoUri) {
          await deleteInventoryPhoto(originalPhotoUri);
          finalPhotoUri = null;
        }
      }
      await updateInventoryItem(item.id, {
        name: name.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        bin_location: binLocation.trim() || null,
        purchase_cost: cost,
        listing_price: listPrice,
        sale_price: soldPrice,
        fees: feesVal,
        shipping_cost: shipVal,
        barcode: barcode.trim() || null,
        marketplace_platform: platform,
        marketplace_url: marketplaceUrl.trim() || null,
        photo_uri: finalPhotoUri,
      });
      await hapticSuccess();
      router.back();
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'Failed to update item'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
        {item && (
          <Text
            style={{
              color: isDark ? '#60A5FA' : '#2563EB',
              fontWeight: '800',
              fontSize: 16,
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            Editing #{formatInventoryNumber(item.inventory_number)}
          </Text>
        )}
        <PhotoPicker
          photoUri={photoUri}
          onPhotoSelected={setPhotoUri}
          onPhotoRemoved={() => setPhotoUri(null)}
          size={160}
        />
        <Text style={labelStyle}>Name *</Text>
        <TextInput
          style={inputStyle}
          value={name}
          onChangeText={setName}
          placeholderTextColor="#9CA3AF"
        />
        <Text style={labelStyle}>Description</Text>
        <TextInput
          style={[inputStyle, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          placeholderTextColor="#9CA3AF"
        />
        <Text style={labelStyle}>Category</Text>
        <TextInput
          style={inputStyle}
          value={category}
          onChangeText={setCategory}
          placeholderTextColor="#9CA3AF"
        />
        <Text style={labelStyle}>Bin Location</Text>
        <TextInput
          style={inputStyle}
          value={binLocation}
          onChangeText={setBinLocation}
          placeholderTextColor="#9CA3AF"
        />
        <Text style={labelStyle}>Barcode</Text>
        <TextInput
          style={inputStyle}
          value={barcode}
          onChangeText={setBarcode}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
        />
        <Text style={labelStyle}>Purchase Cost</Text>
        <TextInput
          style={inputStyle}
          value={purchaseCost}
          onChangeText={setPurchaseCost}
          keyboardType="decimal-pad"
          placeholderTextColor="#9CA3AF"
        />
        <Text style={labelStyle}>Listing Price</Text>
        <TextInput
          style={inputStyle}
          value={listingPrice}
          onChangeText={setListingPrice}
          keyboardType="decimal-pad"
          placeholderTextColor="#9CA3AF"
        />
        <Text style={labelStyle}>Sale Price</Text>
        <TextInput
          style={inputStyle}
          value={salePrice}
          onChangeText={setSalePrice}
          keyboardType="decimal-pad"
          placeholderTextColor="#9CA3AF"
        />
        <Text style={labelStyle}>Fees</Text>
        <TextInput
          style={inputStyle}
          value={fees}
          onChangeText={setFees}
          keyboardType="decimal-pad"
          placeholderTextColor="#9CA3AF"
        />
        <Text style={labelStyle}>Shipping cost</Text>
        <TextInput
          style={inputStyle}
          value={shippingCost}
          onChangeText={setShippingCost}
          keyboardType="decimal-pad"
          placeholderTextColor="#9CA3AF"
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
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.cancelBtn]}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={{ color: '#6B7280', fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.saveBtn]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '600', marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 28,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelBtn: {},
  saveBtn: { backgroundColor: '#3B82F6' },
});
