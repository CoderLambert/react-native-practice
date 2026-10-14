import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { useBookmarks } from './queries';
import { ArticleCard } from './ArticleCard';
import { Failure, Heading, Loading, Message, Screen } from '../../ui/components';

export function SavedScreen() {
  const query = useBookmarks();
  return <Screen scroll={false}><FlatList data={query.data ?? []} keyExtractor={item => item.id}
    style={{ width: '100%', maxWidth: 840, alignSelf: 'center' }} contentContainerStyle={{ padding: 22, paddingBottom: 32, flexGrow: 1 }}
    ListHeaderComponent={<View style={{ marginBottom: 18, gap: 12 }}><Heading eyebrow="YOUR READING LIBRARY" title="留给之后的自己" subtitle="收藏是独立持久化快照，清理资讯缓存不会删除它。" />
      <Message text="全文示例可以离线阅读全文。真实新闻仅保存来源已提供的内容，不缓存站外网页。" /></View>}
    ListEmptyComponent={query.isPending ? <Loading /> : query.isError ? <Failure error={query.error} retry={() => void query.refetch()} /> : <Message text="还没有收藏。在文章页点击收藏，然后断网、结束进程，再回来试试。" />}
    renderItem={({ item }) => <ArticleCard article={item} onPress={() => router.push({ pathname: '/article/[id]', params: { id: item.id } })} />}
  /></Screen>;
}
