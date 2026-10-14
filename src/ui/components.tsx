import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './theme';

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const c = useTheme();
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: c.bg }}>
    {scroll ? <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">{children}</ScrollView> : children}
  </SafeAreaView>;
}
export function Heading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  const c = useTheme();
  return <View style={s.heading}>
    <Text style={[s.eyebrow, { color: c.accent }]}>{eyebrow}</Text>
    <Text accessibilityRole="header" style={[s.title, { color: c.text }]}>{title}</Text>
    {subtitle ? <Text style={[s.body, { color: c.muted }]}>{subtitle}</Text> : null}
  </View>;
}
export function Body({ children }: PropsWithChildren) {
  const c = useTheme(); return <Text style={[s.body, { color: c.muted }]}>{children}</Text>;
}
export function Panel({ children }: PropsWithChildren) {
  const c = useTheme(); return <View style={[s.panel, { backgroundColor: c.surface, borderColor: c.line }]}>{children}</View>;
}
export function Button({ title, onPress, disabled = false, secondary = false, testID }: {
  title: string; onPress: () => void; disabled?: boolean; secondary?: boolean; testID?: string;
}) {
  const c = useTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} testID={testID}
    style={({ pressed }) => [s.button, { backgroundColor: secondary ? c.soft : c.accent, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 }]}>
    <Text style={{ color: secondary ? c.text : c.inverse, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>{title}</Text>
  </Pressable>;
}
export function Message({ text, error = false }: { text: string; error?: boolean }) {
  const c = useTheme();
  return <Text accessibilityLiveRegion="polite" style={[s.message, { color: error ? c.danger : c.muted, backgroundColor: c.soft }]}>{text}</Text>;
}
export function Loading({ text = '正在加载…' }: { text?: string }) {
  const c = useTheme(); return <View style={s.state}><ActivityIndicator color={c.accent} /><Body>{text}</Body></View>;
}
export function Failure({ error, retry }: { error: unknown; retry?: () => void }) {
  return <View style={s.state}><Message error text={error instanceof Error ? error.message : '操作失败，请重试'} />
    {retry ? <Button title="重试" onPress={retry} secondary /> : null}</View>;
}
export function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const c = useTheme(); return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress}
    style={[s.choice, { borderColor: selected ? c.accent : c.line, backgroundColor: selected ? c.soft : c.surface }]}>
    <Text style={{ color: selected ? c.accent : c.muted, fontWeight: selected ? '700' : '400' }}>{label}</Text>
  </Pressable>;
}
const s = StyleSheet.create({
  content: { padding: 22, paddingBottom: 36, gap: 16, maxWidth: 840, width: '100%', alignSelf: 'center' },
  heading: { gap: 9, paddingVertical: 8 }, eyebrow: { fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  title: { fontSize: 34, lineHeight: 44, fontWeight: '800' }, body: { fontSize: 15, lineHeight: 24 },
  panel: { padding: 20, borderRadius: 18, borderWidth: 1, gap: 13 },
  button: { minHeight: 48, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 12, justifyContent: 'center' },
  message: { padding: 13, borderRadius: 10, fontSize: 13, lineHeight: 21 },
  state: { padding: 24, gap: 16, alignItems: 'center' },
  choice: { minHeight: 44, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24, justifyContent: 'center' },
});
