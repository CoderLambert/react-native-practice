import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

export type DeviceSnapshot = { manufacturer: string; model: string; androidVersion: string; sdk: number;
  batteryPercent: number | null; powerSaveMode: boolean; availableMemoryMb: number; totalMemoryMb: number };
type NativeDevice = { getSnapshot(): DeviceSnapshot; setKeepScreenOn(enabled: boolean): Promise<void>; openAppSettings(): Promise<void> };
const native = Platform.OS === 'android' ? requireOptionalNativeModule<NativeDevice>('NewsDevice') : null;
export const device = {
  supported: native !== null,
  reason: Platform.OS === 'android' ? '请使用包含 NewsDevice 模块的 Development Build，Expo Go 不包含此 Kotlin 模块。' : '此实验由 Kotlin 实现，仅适用于 Android；阅读、收藏等其他功能不依赖它。',
  snapshot(): DeviceSnapshot { if (!native) throw new Error(device.reason); return native.getSnapshot(); },
  async keepScreenOn(enabled: boolean) { if (native) await native.setKeepScreenOn(enabled); else if (enabled) throw new Error(device.reason); },
  async openSettings() { if (!native) throw new Error(device.reason); await native.openAppSettings(); },
};
