import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** Light haptic; no-ops on failure (e.g. web / missing hardware) */
export async function hapticLight(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // ignore
  }
}

export async function hapticSuccess(): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch {
    // ignore
  }
}

export async function hapticWarning(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // ignore
  }
}
