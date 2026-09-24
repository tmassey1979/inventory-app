import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDatabase } from '../src/db/database';
import { seedDevelopmentData } from '../src/db/inventoryRepository';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scheme = useColorScheme();

  useEffect(() => {
    (async () => {
      try {
        await getDatabase();
        await seedDevelopmentData();
        setReady(true);
      } catch (e) {
        console.error('DB init error:', e);
        setError(e instanceof Error ? e.message : 'Database init failed');
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Initializing inventory...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: scheme === 'dark' ? '#0f0f1a' : '#ffffff',
          },
          headerTintColor: scheme === 'dark' ? '#F9FAFB' : '#111827',
          tabBarStyle: {
            backgroundColor: scheme === 'dark' ? '#0f0f1a' : '#ffffff',
            borderTopColor: scheme === 'dark' ? '#374151' : '#E5E7EB',
          },
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: '#9CA3AF',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarLabel: 'Dashboard',
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text>,
          }}
        />
        <Tabs.Screen
          name="inventory/index"
          options={{
            title: 'Inventory',
            tabBarLabel: 'Inventory',
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>📦</Text>,
          }}
        />
        <Tabs.Screen
          name="inventory/add"
          options={{
            title: 'Add Item',
            tabBarLabel: 'Add',
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>➕</Text>,
          }}
        />
        <Tabs.Screen name="inventory/[id]" options={{ href: null, title: 'Item Details' }} />
        <Tabs.Screen name="inventory/edit" options={{ href: null, title: 'Edit Item' }} />
        <Tabs.Screen name="inventory/status" options={{ href: null, title: 'Change Status' }} />
      </Tabs>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f1a',
  },
  loadingText: { marginTop: 12, color: '#9CA3AF', fontSize: 16 },
  errorText: { color: '#EF4444', fontSize: 16, textAlign: 'center', padding: 24 },
});
