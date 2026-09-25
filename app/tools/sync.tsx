import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  startHostSession,
  stopHostSession,
  getLocalIpAddress,
  pullFromPeer,
  pushToPeer,
  refreshHostBundle,
  isHostActive,
  DEFAULT_PORT,
} from '../../src/services/lanSync';
import { exportJsonFile, shareFile } from '../../src/services/exportImport';
import { hapticSuccess } from '../../src/utils/haptics';

export default function SyncScreen() {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [ip, setIp] = useState<string | null>(null);
  const [peerIp, setPeerIp] = useState('');
  const [hosting, setHosting] = useState(isHostActive());
  const [itemCount, setItemCount] = useState(0);
  const [busy, setBusy] = useState(false);

  const bg = isDark ? '#0f0f1a' : '#F9FAFB';
  const card = isDark ? '#1e1e2e' : '#fff';
  const text = isDark ? '#F9FAFB' : '#111827';
  const muted = isDark ? '#9CA3AF' : '#6B7280';

  useEffect(() => {
    getLocalIpAddress().then(setIp);
    return () => {
      // keep host session if user navigates away while hosting
    };
  }, []);

  const startHost = async () => {
    setBusy(true);
    try {
      const session = await startHostSession();
      setIp(session.ip);
      setItemCount(session.itemCount);
      setHosting(true);
      await hapticSuccess();
      Alert.alert(
        'Host ready',
        session.ip
          ? `This device is hosting ${session.itemCount} items.\n\nIP: ${session.ip}\nPort: ${session.port}\n\nNote: Expo Go cannot open a real server port. Use "Share export file" for reliable offline transfer, or a dev build with a native HTTP bridge for live pull.`
          : 'Could not detect Wi‑Fi IP. Connect to Wi‑Fi and try again.'
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to host');
    } finally {
      setBusy(false);
    }
  };

  const stopHost = () => {
    stopHostSession();
    setHosting(false);
    setItemCount(0);
  };

  const pull = async () => {
    if (!peerIp.trim()) {
      Alert.alert('Enter host IP', 'Type the IP shown on the other phone.');
      return;
    }
    setBusy(true);
    try {
      const result = await pullFromPeer(peerIp.trim(), DEFAULT_PORT);
      await hapticSuccess();
      Alert.alert(
        'Synced',
        `Imported ${result.items} item(s), ${result.photos} photo(s).`
      );
    } catch (e) {
      Alert.alert(
        'Sync failed',
        (e instanceof Error ? e.message : 'Failed') +
          '\n\nFallback: on the host, use Tools → Export JSON, then Import on this device (AirDrop / Nearby Share still works offline on the same network).'
      );
    } finally {
      setBusy(false);
    }
  };

  const push = async () => {
    if (!peerIp.trim()) {
      Alert.alert('Enter host IP');
      return;
    }
    setBusy(true);
    try {
      await pushToPeer(peerIp.trim(), DEFAULT_PORT);
      await hapticSuccess();
      Alert.alert('Pushed', 'Local inventory sent to peer.');
    } catch (e) {
      Alert.alert('Push failed', e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
    >
      <Text style={[styles.title, { color: text }]}>LAN Sync</Text>
      <Text style={[styles.body, { color: muted }]}>
        Keep every phone on the same Wi‑Fi in sync — no cloud account. Best path
        in Expo Go: export JSON on one device and import on the other. Live
        HTTP pull works when a native HTTP bridge is available (dev client).
      </Text>

      <View style={[styles.card, { backgroundColor: card }]}>
        <Text style={[styles.label, { color: muted }]}>This device IP</Text>
        <Text style={[styles.ip, { color: text }]}>{ip ?? 'Not on Wi‑Fi'}</Text>
        <Text style={[styles.label, { color: muted, marginTop: 8 }]}>
          Sync port
        </Text>
        <Text style={{ color: text, fontWeight: '600' }}>{DEFAULT_PORT}</Text>
      </View>

      <Text style={[styles.section, { color: muted }]}>Host</Text>
      {!hosting ? (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#3B82F6' }]}
          onPress={startHost}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Start hosting inventory</Text>
          )}
        </TouchableOpacity>
      ) : (
        <>
          <Text style={{ color: '#10B981', marginBottom: 8 }}>
            Hosting {itemCount} items
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#6B7280' }]}
            onPress={async () => {
              const n = await refreshHostBundle();
              setItemCount(n);
            }}
          >
            <Text style={styles.btnText}>Refresh snapshot</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#EF4444', marginTop: 8 }]}
            onPress={stopHost}
          >
            <Text style={styles.btnText}>Stop hosting</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: '#8B5CF6', marginTop: 12 }]}
        onPress={async () => {
          setBusy(true);
          try {
            const path = await exportJsonFile();
            await shareFile(path);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text style={styles.btnText}>Share export file (recommended)</Text>
      </TouchableOpacity>

      <Text style={[styles.section, { color: muted }]}>Join peer</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: card,
            color: text,
            borderColor: isDark ? '#374151' : '#E5E7EB',
          },
        ]}
        placeholder="Host IP e.g. 192.168.1.12"
        placeholderTextColor="#9CA3AF"
        value={peerIp}
        onChangeText={setPeerIp}
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
      />
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: '#06B6D4' }]}
        onPress={pull}
        disabled={busy}
      >
        <Text style={styles.btnText}>Pull from host</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: '#0EA5E9', marginTop: 8 }]}
        onPress={push}
        disabled={busy}
      >
        <Text style={styles.btnText}>Push to host</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  card: { borderRadius: 12, padding: 16, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  ip: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  section: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 10,
  },
});
