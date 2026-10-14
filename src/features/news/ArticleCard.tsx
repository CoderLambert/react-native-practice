import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Article } from '../../domain/models';
import { useTheme } from '../../ui/theme';

export function ArticleCard({ article, onPress, featured = false }: { article: Article; onPress: () => void; featured?: boolean }) {
  const c = useTheme();
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`阅读：${article.title}`}
    testID={`article-${article.id}`} style={({ pressed }) => [s.card, { borderColor: c.line,
      backgroundColor: featured ? c.soft : c.surface, opacity: pressed ? 0.75 : 1 }]}>
    <View style={s.meta}><Text style={[s.tag, { color: c.accent }]}>{article.category} · {article.source === 'demo' ? '原创教学示例' : 'HACKER NEWS'}</Text>
      <Text style={{ color: c.muted, fontSize: 12 }}>{article.bodyKind === 'full' ? '全文' : '摘要 / 链接'}</Text></View>
    <Text style={[s.title, featured && s.featured, { color: c.text }]}>{article.title}</Text>
    <Text numberOfLines={3} style={[s.summary, { color: c.muted }]}>{article.summary}</Text>
    <View style={s.meta}><Text style={{ color: c.muted, fontSize: 12 }}>{article.author} · {new Date(article.publishedAt).toLocaleDateString()}</Text>
      <Text style={{ color: c.accent, fontWeight: '700' }}>阅读 →</Text></View>
  </Pressable>;
}
const s = StyleSheet.create({
  card: { padding: 20, borderWidth: 1, borderRadius: 18, gap: 13, marginBottom: 14 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  tag: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 20, fontWeight: '700', lineHeight: 30 }, featured: { fontSize: 26, lineHeight: 38 },
  summary: { fontSize: 14, lineHeight: 23 },
});
