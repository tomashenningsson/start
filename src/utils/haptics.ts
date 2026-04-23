type ImpactStyleType = 'light' | 'medium' | 'heavy';
type NotificationTypeParam = 'success' | 'warning' | 'error';

export async function hapticImpact(style: ImpactStyleType = 'medium') {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');

    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    } as const;

    await Haptics.impact({ style: styleMap[style] });
  } catch {
    // Capacitor not available or not on native platform
  }
}

export async function hapticNotification(type: NotificationTypeParam = 'success') {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const { Haptics, NotificationType } = await import('@capacitor/haptics');

    const typeMap = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    } as const;

    await Haptics.notification({ type: typeMap[type] });
  } catch {
    // Capacitor not available or not on native platform
  }
}

export async function hapticSelection() {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const { Haptics } = await import('@capacitor/haptics');
    await Haptics.selectionStart();
    await Haptics.selectionEnd();
  } catch {
    // Capacitor not available or not on native platform
  }
}
