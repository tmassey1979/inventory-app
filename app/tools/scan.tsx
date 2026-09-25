import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticSuccess } from '../../src/utils/haptics';

export default function ScanBarcodeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? '#0f0f1a' : '#F9FAFB' }]}>
        <Text style={{ color: isDark ? '#F9FAFB' : '#111', textAlign: 'center', marginBottom: 16 }}>
          Camera permission is required to scan barcodes.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const onBarcode = async (result: BarcodeScanningResult) => {
    if (locked) return;
    const data = result.data?.trim();
    if (!data) return;
    setLocked(true);
    await hapticSuccess();
    Alert.alert('Barcode scanned', data, [
      {
        text: 'Use on new item',
        onPress: () => {
          router.replace({ pathname: '/inventory/add', params: { barcode: data } });
        },
      },
      {
        text: 'Scan again',
        onPress: () => setLocked(false),
      },
      { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code128',
            'code39',
            'qr',
          ],
        }}
        onBarcodeScanned={locked ? undefined : onBarcode}
      />
      <View style={[styles.overlay, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.hint}>Point at a barcode or QR code</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingTop: 16,
  },
  hint: { color: '#fff', marginBottom: 12, fontWeight: '600' },
  btn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
