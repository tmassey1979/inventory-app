import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  accentColor?: string;
}

export function DashboardCard({
  title,
  value,
  subtitle,
  accentColor = '#3B82F6',
}: Props) {
  const isDark = useColorScheme() === 'dark';
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1e1e2e' : '#ffffff',
          borderLeftColor: accentColor,
        },
      ]}
    >
      <Text style={[styles.title, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
        {title}
      </Text>
      <Text style={[styles.value, { color: isDark ? '#F9FAFB' : '#111827' }]}>
        {value}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 11, marginTop: 2 },
});
