import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const isDark = useColorScheme() === 'dark';
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialog,
            { backgroundColor: isDark ? '#1e1e2e' : '#ffffff' },
          ]}
        >
          <Text style={[styles.title, { color: isDark ? '#F9FAFB' : '#111827' }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            {message}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                destructive ? styles.destructiveBtn : styles.confirmBtn,
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: { width: '100%', maxWidth: 340, borderRadius: 16, padding: 24 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  message: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  cancelBtn: { backgroundColor: 'transparent' },
  cancelText: { color: '#6B7280', fontWeight: '600', fontSize: 15 },
  confirmBtn: { backgroundColor: '#3B82F6' },
  destructiveBtn: { backgroundColor: '#EF4444' },
  confirmText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
});
