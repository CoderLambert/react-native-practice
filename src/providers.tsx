import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { AppState, Platform, useColorScheme } from 'react-native';
import * as Network from 'expo-network';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { retryable } from './domain/http';
import { DEFAULT_SETTINGS } from './domain/models';
import { useSettingsQuery } from './features/news/queries';
import { ThemeContext, dark, light } from './ui/theme';
import { Screen, Failure, Loading } from './ui/components';

function Theme({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const settings = useSettingsQuery();
  const theme = settings.data?.theme ?? DEFAULT_SETTINGS.theme;
  const isDark = theme === 'system' ? system === 'dark' : theme === 'dark';
  return <ThemeContext.Provider value={isDark ? dark : light}>
    <StatusBar style={isDark ? 'light' : 'dark'} />
    {settings.isPending ? <Screen><Loading text="正在打开本地阅读库…" /></Screen> :
      settings.isError ? <Screen><Failure error={settings.error} retry={() => void settings.refetch()} /></Screen> : children}
  </ThemeContext.Provider>;
}
export function Providers({ children }: PropsWithChildren) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: {
    staleTime: 60000, gcTime: 30 * 60 * 1000,
    retry: (count, error) => count < 1 && retryable(error),
    retryDelay: 2000,
  }, mutations: { retry: false } } }));
  useEffect(() => {
    const app = AppState.addEventListener('change', state => {
      if (Platform.OS !== 'web') focusManager.setFocused(state === 'active');
    });
    // Local-backed queries stay runnable offline; reconnect explicitly invalidates live feeds.
    const net = Network.addNetworkStateListener(state => {
      if (state.isConnected && state.isInternetReachable !== false) {
        void client.invalidateQueries({ queryKey: ['feed', 'hn'] });
      }
    });
    return () => { app.remove(); net.remove(); };
  }, [client]);
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider>
    <QueryClientProvider client={client}><Theme>{children}</Theme></QueryClientProvider>
  </SafeAreaProvider></GestureHandlerRootView>;
}
