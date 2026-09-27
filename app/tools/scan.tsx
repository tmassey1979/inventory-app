import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Alert,
  AppState,
} from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticSuccess } from '../../src/utils/haptics';
import { getItemByBarcode } from '../../src/db/inventoryRepository';
import { formatInventoryNumber } from '../../src/utils/inventoryNumber';

const BARCODE_TYPES = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'code93',
  'itf14',
  'qr',
  'pdf417',
] as const;

export default function ScanBarcodeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [torch, setTorch] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const handling = useRef(false);
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string; itemId?: string }>();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      setCameraActive(true);
      setLocked(false);
      handling.current = false;
      return () => {
        setCameraActive(false);
        setTorch(false);
      };
    }, [])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        setCameraActive(false);
        setTorch(false);
      } else {
        setCameraActive(true);
      }
    });
    return () => sub.remove();
  }, []);

  const routeAfterScan = useCallback(
    async (data: string) => {
      if (params.returnTo === 'edit' && params.itemId) {
        router.replace({
          pathname: '/inventory/edit',
          params: { id: params.itemId, barcode: data },
        });
        return;
      }
      if (params.returnTo === 'add') {
        router.replace({
          pathname: '/inventory/add',
          params: { barcode: data },
        });
        return;
      }

      try {
        const existing = await getItemByBarcode(data);
        if (existing) {
          Alert.alert(
            'Item found',
            `#${formatInventoryNumber(existing.inventory_number)} — ${existing.name}`,
            [
              {
                text: 'Open item',
                onPress: () => router.replace(`/inventory/${existing.id}`),
              },
              {
                text: 'Create new anyway',
                onPress: () =>
                  router.replace({
                    pathname: '/inventory/add',
                    params: { barcode: data },
                  }),
              },
              {
                text: 'Scan again',
                style: 'cancel',
                onPress: () => {
                  handling.current = false;
                  setLocked(false);
                },
              },
            ]
          );
          return;
        }
      } catch {
        // fall through to create
      }

      Alert.alert('Barcode scanned', data, [
        {
          text: 'Use on new item',
          onPress: () =>
            router.replace({
              pathname: '/inventory/add',
              params: { barcode: data },
            }),
        },
        {
          text: 'Scan again',
          onPress: () => {
            handling.current = false;
            setLocked(false);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => router.back(),
        },
      ]);
    },
    [params.returnTo, params.itemId, router]
  );

  const onBarcode = async (result: BarcodeScanningResult) => {
    if (locked || handling.current) return;
    const data = result.data?.trim();
    if (!data) return;
    handling.current = true;
    setLocked(true);
    await hapticSuccess();
    await routeAfterScan(data);
  };

  const tryModernScanner = async () => {
    try {
      if (!CameraView.isModernBarcodeScannerAvailable) {
        Alert.alert(
          'Not available',
          'System scanner needs iOS 16+ or Google Play Services on Android. Using the in-app camera instead.'
        );
        return;
      }
      setCameraActive(false);
      const sub = CameraView.onModernBarcodeScanned?.(async (event: {
        data?: string;
      }) => {
        const data = event?.data?.trim();
        if (!data || handling.current) return;
        handling.current = true;
        sub?.remove?.();
        await hapticSuccess();
        await routeAfterScan(data);
      });
      await CameraView.launchScanner({
        barcodeTypes: [...BARCODE_TYPES],
      });
    } catch (e) {
      setCameraActive(true);
      Alert.alert(
        'Scanner unavailable',
        e instanceof Error ? e.message : 'Could not open system scanner'
      );
    }
  };

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: isDark ? '#0f0f1a' : '#F9FAFB' },
        ]}
      >
        <Text
          style={{
            color: isDark ? '#F9FAFB' : '#111',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          Camera permission is required to scan barcodes.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {cameraActive ? (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          active={cameraActive}
          enableTorch={torch}
          barcodeScannerSettings={{
            barcodeTypes: [...BARCODE_TYPES],
          }}
          onBarcodeScanned={locked ? undefined : onBarcode}
        />
      ) : (
        <View style={[styles.center, { backgroundColor: '#000' }]}>
          <Text style={{ color: '#fff' }}>Camera paused</Text>
        </View>
      )}

      <View pointerEvents="none" style={styles.reticleWrap}>
        <View style={styles.reticle} />
      </View>

      <View
        style={[
          styles.overlay,
          { paddingBottom: insets.bottom + 24, paddingTop: insets.top + 8 },
        ]}
      >
        <Text style={styles.hint}>Point at a barcode or QR code</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => setTorch((t) => !t)}
          >
            <Text style={styles.btnText}>{torch ? 'Torch off' : 'Torch'}</Text>
          </TouchableOpacity>
          {CameraView.isModernBarcodeScannerAvailable ? (
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={tryModernScanner}
            >
              <Text style={styles.btnText}>System scan</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
            <Text style={styles.btnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 16,
  },
  hint: { color: '#fff', marginBottom: 12, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  btn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnSecondary: { backgroundColor: '#374151' },
  btnText: { color: '#fff', fontWeight: '700' },
  reticleWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticle: {
    width: 240,
    height: 140,
    borderWidth: 2,
    borderColor: 'rgba(59,130,246,0.9)',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
});
