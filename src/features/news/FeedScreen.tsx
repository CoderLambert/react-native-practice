import { useMemo, useState } from 'react';
import { FlatList, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { CATEGORIES, filterArticles } from '../../domain/models';
import { useFeed, useSettingsQuery } from './queries';
import { ArticleCard } from './ArticleCard';
import { Body, Button, Choice, Failure, Heading, Loading, Message, Screen } from '../../ui/components';
import { useTheme } from '../../ui/theme';

export function FeedScreen() {
  const c = useTheme();
  const settings = useSettingsQuery();
  const source = settings.data?.source ?? 'demo';
  const feed = useFeed(source);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const articles = useMemo(() => filterArticles(feed.data?.pages.flatMap(p => p.items) ?? [], search, category), [feed.data, search, category]);
  const cache = feed.data?.pages.find(p => p.origin === 'cache');
  const warning = feed.data?.pages.find(p => p.warning)?.warning;
  return <Screen scroll={false}><FlatList data={articles} keyExtractor={item => item.id}
    style={{ width: '100%', maxWidth: 840, alignSelf: 'center' }}
    contentContainerStyle={{ padding: 22, paddingBottom: 32, flexGrow: 1 }} keyboardShouldPersistTaps="handled"
    refreshing={feed.isRefetching && !feed.isFetchingNextPage} onRefresh={() => void feed.refetch()}
    ListHeaderComponent={<View style={{ gap: 14, marginBottom: 18 }}>
      <Heading eyebrow="NEWSLAB / READ · LEARN · BUILD" title="闻序" subtitle="读新闻，也读懂一个原生应用的工作方式。" />
      <Message text={source === 'demo' ? '当前为内置教学示例，不是实时新闻。在设置中切换 Hacker News，体验真实 API。' : '实时来源：Hacker News 官方 API。站外新闻仅展示标题、摘要和原文链接。'} />
      <TextInput testID="feed-search" accessibilityLabel="搜索已加载的新闻" placeholder="搜索已加载的标题、摘要、作者" placeholderTextColor={c.muted}
        value={search} onChangeText={setSearch} clearButtonMode="while-editing" autoCorrect={false}
        style={{ backgroundColor: c.surface, color: c.text, borderColor: c.line, borderWidth: 1, borderRadius: 12, minHeight: 48, paddingHorizontal: 15 }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {['全部', ...CATEGORIES].map(item => <Choice key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}
      </ScrollView>
      <Body>{articles.length} 篇可见 · 搜索与分类仅作用于已加载内容</Body>
      {warning ? <Message text={`${warning}${cache ? ` · 缓存时间 ${new Date(cache.savedAt).toLocaleString()}` : ''}`} /> : null}
      {feed.isError && feed.data ? <Failure error={feed.error} retry={() => void feed.refetch()} /> : null}
    </View>}
    renderItem={({ item, index }) => <ArticleCard article={item} featured={index === 0 && !search} onPress={() => router.push({ pathname: '/article/[id]', params: { id: item.id } })} />}
    ListEmptyComponent={feed.isPending ? <Loading /> : feed.isError ? <Failure error={feed.error} retry={() => void feed.refetch()} /> : <Message text="没有匹配内容。可清空筛选，或继续加载下一页。" />}
    ListFooterComponent={feed.hasNextPage ? <Button title={feed.isFetchingNextPage ? '正在加载…' : '加载更多'} secondary disabled={feed.isFetching} onPress={() => void feed.fetchNextPage()} testID="load-more" /> : <Body>已到当前列表末尾</Body>}
  /></Screen>;
}
