import { Platform } from 'react-native';

/** Light haptic; no-ops if expo-haptics is unavailable */
export async function hapticLight(): Promise<void> {
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // optional dependency / web
  }
}

export async function hapticSuccess(): Promise<void> {
  try {
    const Haptics = await import('expo-haptics');
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
    const Haptics = await import('expo-haptics');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // ignore
  }
}
