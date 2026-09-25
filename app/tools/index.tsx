import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import {
  exportCsvFile,
  exportJsonFile,
  shareFile,
  importFromJsonString,
} from '../../src/services/exportImport';
import { getItemsToShip } from '../../src/db/inventoryRepository';
import { printShippingChecklist } from '../../src/services/printService';
import { hapticSuccess, hapticLight } from '../../src/utils/haptics';

export default function ToolsScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  const bg = isDark ? '#0f0f1a' : '#F9FAFB';
  const card = isDark ? '#1e1e2e' : '#fff';
  const text = isDark ? '#F9FAFB' : '#111827';
  const muted = isDark ? '#9CA3AF' : '#6B7280';

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      await hapticSuccess();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const Tool = ({
    title,
    subtitle,
    onPress,
    color = '#3B82F6',
  }: {
    title: string;
    subtitle: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: card, borderLeftColor: color }]}
      onPress={() => {
        hapticLight();
        onPress();
      }}
      disabled={busy}
    >
      <Text style={[styles.cardTitle, { color: text }]}>{title}</Text>
      <Text style={[styles.cardSub, { color: muted }]}>{subtitle}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
    >
      <Text style={[styles.heading, { color: text }]}>Tools</Text>
      {busy && (
        <View style={styles.busy}>
          <ActivityIndicator color="#3B82F6" />
          <Text style={{ color: muted, marginLeft: 8 }}>Working…</Text>
        </View>
      )}

      <Text style={[styles.section, { color: muted }]}>Data</Text>
      <Tool
        title="Export JSON (full backup)"
        subtitle="Items, history, photos, labels — for restore or LAN hand-off"
        onPress={() =>
          run(async () => {
            const path = await exportJsonFile();
            await shareFile(path);
          })
        }
        color="#8B5CF6"
      />
      <Tool
        title="Export CSV"
        subtitle="Spreadsheet-friendly item list"
        onPress={() =>
          run(async () => {
            const path = await exportCsvFile();
            await shareFile(path);
          })
        }
        color="#8B5CF6"
      />
      <Tool
        title="Import JSON backup"
        subtitle="Merge items from another device or backup file"
        onPress={() =>
          run(async () => {
            const result = await DocumentPicker.getDocumentAsync({
              type: 'application/json',
              copyToCacheDirectory: true,
            });
            if (result.canceled || !result.assets?.[0]) return;
            const json = await FileSystem.readAsStringAsync(result.assets[0].uri);
            const stats = await importFromJsonString(json);
            Alert.alert(
              'Import complete',
              `Merged ${stats.items} item(s), ${stats.photos} photo(s).`
            );
          })
        }
        color="#10B981"
      />

      <Text style={[styles.section, { color: muted }]}>Shipping</Text>
      <Tool
        title="Shipping checklist"
        subtitle="Print all Packed items (labels attached?)"
        onPress={() =>
          run(async () => {
            const items = await getItemsToShip();
            if (items.length === 0) {
              Alert.alert('Nothing to ship', 'No items with status Packed.');
              return;
            }
            await printShippingChecklist(items);
          })
        }
        color="#F59E0B"
      />
      <Tool
        title="LAN sync (same Wi‑Fi)"
        subtitle="Host or join another phone — no cloud backend"
        onPress={() => router.push('/tools/sync')}
        color="#06B6D4"
      />

      <Text style={[styles.section, { color: muted }]}>Capture</Text>
      <Tool
        title="Scan barcode"
        subtitle="Look up or attach a barcode to a new item"
        onPress={() => router.push('/tools/scan')}
        color="#3B82F6"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 28, fontWeight: '800', marginBottom: 12 },
  section: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  busy: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
});
