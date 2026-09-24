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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhotoPicker } from '../../src/components/PhotoPicker';
import { createInventoryItem, updateInventoryItem } from '../../src/db/inventoryRepository';
import { saveInventoryPhoto } from '../../src/services/imageStorage';
import { formatInventoryNumber } from '../../src/utils/inventoryNumber';
import { parseCurrency } from '../../src/utils/currency';
import type { InventoryStatus } from '../../src/models/InventoryStatus';
import { INVENTORY_STATUSES } from '../../src/models/InventoryStatus';

export default function AddItemScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [binLocation, setBinLocation] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
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
        photo_uri: null,
      });

      if (photoUri) {
        try {
          const finalPhotoUri = await saveInventoryPhoto(photoUri, item.inventory_number);
          await updateInventoryItem(item.id, { photo_uri: finalPhotoUri });
        } catch (photoErr) {
          console.warn('Photo save failed:', photoErr);
        }
      }

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
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to create item');
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
        style={[styles.container, { backgroundColor: isDark ? '#0f0f1a' : '#F9FAFB' }]}
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
        <TextInput style={inputStyle} value={name} onChangeText={setName} placeholder="Item name" placeholderTextColor="#9CA3AF" />
        <Text style={labelStyle}>Description</Text>
        <TextInput style={[inputStyle, styles.multiline]} value={description} onChangeText={setDescription} placeholder="Optional description" placeholderTextColor="#9CA3AF" multiline numberOfLines={3} />
        <Text style={labelStyle}>Category</Text>
        <TextInput style={inputStyle} value={category} onChangeText={setCategory} placeholder="e.g. Electronics, Kitchen" placeholderTextColor="#9CA3AF" />
        <Text style={labelStyle}>Bin Location</Text>
        <TextInput style={inputStyle} value={binLocation} onChangeText={setBinLocation} placeholder="e.g. A-01, Shelf-2" placeholderTextColor="#9CA3AF" />
        <Text style={labelStyle}>Purchase Cost</Text>
        <TextInput style={inputStyle} value={purchaseCost} onChangeText={setPurchaseCost} placeholder="0.00" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
        <Text style={labelStyle}>Listing Price</Text>
        <TextInput style={inputStyle} value={listingPrice} onChangeText={setListingPrice} placeholder="0.00" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
        <Text style={labelStyle}>Sale Price</Text>
        <TextInput style={inputStyle} value={salePrice} onChangeText={setSalePrice} placeholder="0.00" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
        <Text style={labelStyle}>Status</Text>
        <View style={styles.statusRow}>
          {INVENTORY_STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.statusChip,
                {
                  backgroundColor: status === s ? '#3B82F6' : isDark ? '#1e1e2e' : '#F3F4F6',
                  borderColor: status === s ? '#3B82F6' : isDark ? '#374151' : '#E5E7EB',
                },
              ]}
              onPress={() => setStatus(s)}
            >
              <Text style={{ color: status === s ? '#fff' : isDark ? '#D1D5DB' : '#374151', fontWeight: '600', fontSize: 12 }}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => router.back()} disabled={saving}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.secondaryBtn]} onPress={() => handleSave(true)} disabled={saving}>
            {saving ? <ActivityIndicator color="#3B82F6" /> : <Text style={styles.secondaryText}>Save & Add Another</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={() => handleSave(false)} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 28, justifyContent: 'flex-end' },
  btn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, minWidth: 90, alignItems: 'center' },
  cancelBtn: {},
  cancelText: { color: '#6B7280', fontWeight: '600', fontSize: 15 },
  secondaryBtn: { borderWidth: 1, borderColor: '#3B82F6' },
  secondaryText: { color: '#3B82F6', fontWeight: '600', fontSize: 15 },
  primaryBtn: { backgroundColor: '#3B82F6' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
