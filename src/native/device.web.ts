import type { DeviceSnapshot } from './device';
export const device = {
  supported: false,
  reason: '浏览器预览不具备 Android 系统能力，请在 Development Build 中体验。',
  snapshot(): DeviceSnapshot { throw new Error('Android only'); },
  async keepScreenOn(enabled: boolean) { if (enabled) throw new Error('Android only'); },
  async openSettings() { throw new Error('Android only'); },
};
