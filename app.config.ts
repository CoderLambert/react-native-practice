import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = process.env.APP_VARIANT ?? 'development';
  if (!['development', 'preview', 'production'].includes(variant)) {
    throw new Error('APP_VARIANT must be development, preview or production');
  }
  const suffix = variant === 'production' ? '' : variant === 'preview' ? '.preview' : '.dev';
  const projectId = process.env.EAS_PROJECT_ID;
  return {
    ...config,
    name: variant === 'production' ? '闻序 NewsLab' : `闻序 ${variant}`,
    slug: 'react-native-practice',
    version: '0.1.0',
    scheme: `newslab${suffix.replace('.', '-')}`,
    orientation: 'default',
    userInterfaceStyle: 'automatic',
    ios: { bundleIdentifier: `host.lambert.newslab${suffix}`, supportsTablet: true },
    android: { package: `host.lambert.newslab${suffix}`, allowBackup: false },
    web: { bundler: 'metro', output: 'single', name: '闻序 NewsLab' },
    plugins: ['expo-router', 'expo-sqlite', 'expo-notifications', 'expo-background-task'],
    experiments: { typedRoutes: true },
    runtimeVersion: { policy: 'fingerprint' },
    updates: projectId ? { url: `https://u.expo.dev/${projectId}` } : { enabled: false },
    extra: { ...(projectId ? { eas: { projectId } } : {}) },
  };
};
