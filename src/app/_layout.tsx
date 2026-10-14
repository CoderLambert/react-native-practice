import { Stack } from 'expo-router';
import { Providers } from '../providers';
import { useTheme } from '../ui/theme';
import { useNotificationRouting } from '../native/notifications';
export { ErrorBoundary } from '../ui/route-error';

function Navigation() {
  const c = useTheme();
  useNotificationRouting();
  return <Stack screenOptions={{ headerStyle: { backgroundColor: c.bg }, headerTintColor: c.text, contentStyle: { backgroundColor: c.bg } }}>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="article/[id]" options={{ title: '阅读', headerBackTitle: '返回' }} />
  </Stack>;
}
export default function Layout() { return <Providers><Navigation /></Providers>; }
