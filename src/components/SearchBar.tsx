import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Text,
} from 'react-native';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search inventory...',
}: Props) {
  const isDark = useColorScheme() === 'dark';
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1e1e2e' : '#F3F4F6',
          borderColor: isDark ? '#374151' : '#E5E7EB',
        },
      ]}
    >
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={[styles.input, { color: isDark ? '#F9FAFB' : '#111827' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={12}>
          <Text style={styles.clear}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  icon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, fontSize: 16, height: '100%' },
  clear: { fontSize: 16, color: '#9CA3AF', padding: 4 },
});
