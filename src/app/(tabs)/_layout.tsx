import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../ui/theme';

export default function TabsLayout() {
  const c = useTheme();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: c.accent, tabBarInactiveTintColor: c.muted,
    tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line }, tabBarLabelStyle: { fontSize: 11 } }}>
    <Tabs.Screen name="index" options={{ title: '资讯', tabBarIcon: ({ color, size }) => <Ionicons name="newspaper-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="saved" options={{ title: '收藏', tabBarIcon: ({ color, size }) => <Ionicons name="bookmarks-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="lab" options={{ title: '原生实验室', tabBarIcon: ({ color, size }) => <Ionicons name="flask-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="settings" options={{ title: '设置', tabBarIcon: ({ color, size }) => <Ionicons name="options-outline" color={color} size={size} /> }} />
  </Tabs>;
}
