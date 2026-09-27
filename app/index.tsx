import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDashboard } from '../src/hooks/useDashboard';
import { DashboardCard } from '../src/components/DashboardCard';
import { formatCurrency } from '../src/utils/currency';
import {
  STATUS_COLORS,
  INVENTORY_STATUSES,
  type InventoryStatus,
} from '../src/models/InventoryStatus';
import { isBackupStale, getLastExportAt } from '../src/utils/preferences';
import { hapticLight } from '../src/utils/haptics';

export default function DashboardScreen() {
  const { stats, loading, error, refresh } = useDashboard();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [backupHint, setBackupHint] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
      (async () => {
        const stale = await isBackupStale(14);
        if (stale) {
          const last = await getLastExportAt();
          setBackupHint(
            last
              ? 'Backup is over 14 days old — export JSON from Tools when you can.'
              : 'No backup yet — export JSON from Tools to keep a local copy.'
          );
        } else {
          setBackupHint(null);
        }
      })();
    }, [refresh])
  );

  const openStatus = (status: InventoryStatus) => {
    hapticLight();
    router.push({
      pathname: '/inventory',
      params: { status },
    });
  };

  if (loading && !stats) {
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

  if (error) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: isDark ? '#0f0f1a' : '#F9FAFB' },
        ]}
      >
        <Text style={{ color: '#EF4444' }}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#0f0f1a' : '#F9FAFB' },
      ]}
      contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 24 }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} />
      }
    >
      {backupHint ? (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: isDark ? '#422006' : '#FEF3C7',
              borderColor: isDark ? '#92400E' : '#F59E0B',
            },
          ]}
        >
          <Text style={{ color: isDark ? '#FDE68A' : '#92400E', fontSize: 13 }}>
            {backupHint}
          </Text>
        </View>
      ) : null}

      <Text
        style={[styles.sectionTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}
      >
        Inventory Counts
      </Text>
      <View style={styles.grid}>
        <DashboardCard
          title="Total"
          value={String(stats?.total ?? 0)}
          accentColor="#3B82F6"
          onPress={() => {
            hapticLight();
            router.push('/inventory');
          }}
        />
        {INVENTORY_STATUSES.map((status) => (
          <DashboardCard
            key={status}
            title={status}
            value={String(stats?.byStatus[status] ?? 0)}
            accentColor={STATUS_COLORS[status]}
            onPress={() => openStatus(status)}
          />
        ))}
      </View>
      <Text
        style={[
          styles.sectionTitle,
          { color: isDark ? '#F9FAFB' : '#111827', marginTop: 20 },
        ]}
      >
        Financial Summary
      </Text>
      <View style={styles.grid}>
        <DashboardCard
          title="Total Purchase Cost"
          value={formatCurrency(stats?.totalPurchaseCost)}
          accentColor="#F59E0B"
        />
        <DashboardCard
          title="Current Listed Value"
          value={formatCurrency(stats?.currentListedValue)}
          subtitle="Items with status Listed"
          accentColor="#8B5CF6"
          onPress={() => openStatus('Listed')}
        />
        <DashboardCard
          title="Total Sales"
          value={formatCurrency(stats?.totalSales)}
          subtitle="Sold / Packed / Shipped"
          accentColor="#10B981"
        />
        <DashboardCard
          title="Actual Profit"
          value={formatCurrency(stats?.actualProfit)}
          subtitle="Sale − Purchase"
          accentColor={(stats?.actualProfit ?? 0) >= 0 ? '#10B981' : '#EF4444'}
        />
        <DashboardCard
          title="Net Profit"
          value={formatCurrency(stats?.netProfit)}
          subtitle="Sale − cost − fees − shipping"
          accentColor={(stats?.netProfit ?? 0) >= 0 ? '#10B981' : '#EF4444'}
        />
        <DashboardCard
          title="To Ship"
          value={String(stats?.toShipCount ?? 0)}
          subtitle="Tap → Packed items"
          accentColor="#F59E0B"
          onPress={() => openStatus('Packed')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  banner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 4,
  },
});
