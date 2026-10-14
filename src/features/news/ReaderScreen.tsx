import { useCallback, useState } from 'react';
import { AppState, Linking, Platform, Share, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { keys, useArticle, useBookmarks, useBookmarkMutation, useSettingsQuery } from './queries';
import { Body, Button, Failure, Loading, Message, Screen } from '../../ui/components';
import { useTheme } from '../../ui/theme';
import { useAction } from '../../ui/use-action';
import { speechChunks } from '../../domain/reading';
import { device } from '../../native/device';
import { cancelArticleReminder, remindArticle } from '../../native/notifications';
import { storage } from '../../data/runtime';
import { reportError } from '../../observability';

export function ReaderScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const article = useArticle(id);
  const bookmarks = useBookmarks();
  const mutation = useBookmarkMutation();
  const settings = useSettingsQuery();
  const client = useQueryClient();
  const c = useTheme();
  const action = useAction();
  const [speaking, setSpeaking] = useState(false);
  const [awake, setAwake] = useState(false);
  useFocusEffect(useCallback(() => {
    setSpeaking(false); setAwake(false);
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') { void Speech.stop().catch(reportError); setSpeaking(false); }
    });
    return () => { sub.remove(); void Speech.stop().catch(reportError); void device.keepScreenOn(false).catch(reportError); };
  }, []));
  if (article.isPending) return <Screen><Loading /></Screen>;
  if (article.isError) return <Screen><Failure error={article.error} retry={() => void article.refetch()} /></Screen>;
  const a = article.data;
  const saved = bookmarks.data?.some(item => item.id === a.id) ?? false;
  const fontSize = settings.data?.fontSize ?? 18;
  async function toggleSpeech() {
    if (speaking) { await Speech.stop(); setSpeaking(false); return; }
    await Speech.stop();
    const chunks = speechChunks(`${a.title}。${a.paragraphs.join('。')}`);
    setSpeaking(true);
    chunks.forEach((chunk, index) => Speech.speak(chunk, { language: a.source === 'demo' ? 'zh-CN' : 'en-US',
      onDone: () => { if (index === chunks.length - 1) setSpeaking(false); },
      onStopped: () => setSpeaking(false), onError: error => { setSpeaking(false); reportError(error); },
    }));
  }
  return <Screen><Text style={{ color: c.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>{a.category} / {a.source === 'demo' ? '原创教学示例' : 'HACKER NEWS'}</Text>
    <Text accessibilityRole="header" style={{ fontSize: 31, lineHeight: 44, fontWeight: '800', color: c.text }}>{a.title}</Text>
    <Body>{a.author} · {new Date(a.publishedAt).toLocaleString()}</Body>
    {a.bodyKind === 'summary' ? <Message text="摘要 / 链接模式：以下不是站外文章全文。收藏只保存这些已提供的内容。" /> : null}
    <View style={{ gap: 10 }}>
      <Button testID="bookmark-toggle" title={saved ? '取消收藏' : '收藏到本地'} disabled={action.busy || mutation.isPending || !bookmarks.data} onPress={() => void action.run(async () => {
        await mutation.mutateAsync({ article: a, saved }); void Haptics.selectionAsync().catch(() => undefined);
        return saved ? '已取消收藏' : '已保存内容快照，可离线打开';
      })} />
      {bookmarks.isError ? <Failure error={bookmarks.error} retry={() => void bookmarks.refetch()} /> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Button title={speaking ? '停止朗读' : '系统语音朗读'} secondary disabled={action.busy} onPress={() => void action.run(toggleSpeech)} />
        <Button title="系统分享" secondary disabled={action.busy} onPress={() => void action.run(async () => { await Share.share({ message: `${a.title}\n${a.url ?? a.summary}` }); })} />
        {device.supported ? <Button title={awake ? '恢复自动熄屏' : '阅读时保持亮屏'} secondary disabled={action.busy} onPress={() => void action.run(async () => { await device.keepScreenOn(!awake); setAwake(!awake); })} /> : null}
      </View>
    </View>
    {action.message ? <Message text={action.message} error={action.failed} /> : null}
    <View style={{ height: 1, backgroundColor: c.line, marginVertical: 8 }} />
    {a.paragraphs.map((paragraph, index) => <Text key={index} selectable style={{ fontSize, lineHeight: Math.round(fontSize * 1.9), color: c.text }}>{paragraph}</Text>)}
    {a.url ? <Button title="在浏览器打开原文" secondary onPress={() => void action.run(async () => { await Linking.openURL(a.url!); })} /> : null}
    <View style={{ height: 1, backgroundColor: c.line, marginVertical: 8 }} />
    <Body>原生能力体验：提醒会先收藏当前内容，再申请通知权限。系统可能延后投递。</Body>
    <Button title="收藏并在 10 秒后提醒" disabled={action.busy || Platform.OS === 'web'} onPress={() => void action.run(async () => {
      await storage.saveBookmark(a); await client.invalidateQueries({ queryKey: keys.bookmarks });
      await remindArticle(a); return '已安排本地提醒。回到桌面，点击通知验证文章深链。';
    })} />
    <Button title="取消本文未触发提醒" secondary disabled={action.busy || Platform.OS === 'web'} onPress={() => void action.run(async () => {
      await cancelArticleReminder(a.id); return '本文待触发提醒已取消';
    })} />
    <Body>语音由系统引擎提供，语言包或部分声音可能需要联网。Web 仅用于界面预览。</Body>
  </Screen>;
}
