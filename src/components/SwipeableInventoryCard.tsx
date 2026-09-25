import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useColorScheme,
  Alert,
} from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import type { InventoryItem } from '../models/InventoryItem';
import type { InventoryStatus } from '../models/InventoryStatus';
import { InventoryCard } from './InventoryCard';
import { updateInventoryStatus } from '../db/inventoryRepository';
import { hapticLight, hapticSuccess } from '../utils/haptics';

interface Props {
  item: InventoryItem;
  onPress: () => void;
  onStatusChanged?: () => void;
}

const QUICK: Partial<Record<InventoryStatus, InventoryStatus[]>> = {
  Added: ['Listed', 'Donated', 'Delisted'],
  Listed: ['Sold', 'Delisted', 'Donated'],
  Sold: ['Packed'],
  Packed: ['Shipped'],
  Shipped: [],
  Delisted: ['Listed'],
  Donated: [],
};

const ACTION_COLORS: Record<string, string> = {
  Listed: '#3B82F6',
  Sold: '#10B981',
  Packed: '#F59E0B',
  Shipped: '#8B5CF6',
  Delisted: '#6B7280',
  Donated: '#EC4899',
  Added: '#64748B',
};

export function SwipeableInventoryCard({
  item,
  onPress,
  onStatusChanged,
}: Props) {
  const ref = useRef<Swipeable>(null);
  const isDark = useColorScheme() === 'dark';
  const actions = QUICK[item.status] ?? [];

  const applyStatus = async (status: InventoryStatus) => {
    ref.current?.close();
    try {
      await hapticLight();
      await updateInventoryStatus(item.id, status, `Quick action → ${status}`);
      await hapticSuccess();
      onStatusChanged?.();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Status update failed');
    }
  };

  const renderRight = (
    progress: Animated.AnimatedInterpolation<number>,
    _drag: Animated.AnimatedInterpolation<number>
  ) => {
    if (actions.length === 0) return null;
    return (
      <View style={styles.actionsRow}>
        {actions.slice(0, 3).map((status) => {
          const trans = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [80, 0],
          });
          return (
            <Animated.View
              key={status}
              style={{ transform: [{ translateX: trans }] }}
            >
              <RectButton
                style={[
                  styles.actionBtn,
                  { backgroundColor: ACTION_COLORS[status] ?? '#3B82F6' },
                ]}
                onPress={() => applyStatus(status)}
              >
                <Text style={styles.actionText}>{status}</Text>
              </RectButton>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  return (
    <Swipeable
      ref={ref}
      friction={2}
      rightThreshold={40}
      renderRightActions={actions.length ? renderRight : undefined}
      overshootRight={false}
      containerStyle={{
        backgroundColor: isDark ? '#0f0f1a' : '#F9FAFB',
      }}
    >
      <InventoryCard item={item} onPress={onPress} />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 8,
  },
  actionBtn: {
    width: 76,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
});
