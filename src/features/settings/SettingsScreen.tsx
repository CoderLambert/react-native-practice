import { Platform, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSettingsQuery, useSaveSettings } from '../news/queries';
import { storage } from '../../data/runtime';
import { cancelAllReminders } from '../../native/notifications';
import { Body, Button, Choice, Heading, Message, Panel, Screen } from '../../ui/components';
import { useAction } from '../../ui/use-action';
import { useTheme } from '../../ui/theme';
import { DEFAULT_SETTINGS, type Settings } from '../../domain/models';

export function SettingsScreen() {
  const c = useTheme(); const client = useQueryClient();
  const query = useSettingsQuery(); const save = useSaveSettings(); const action = useAction();
  const settings = query.data ?? DEFAULT_SETTINGS;
  const update = (patch: Partial<Settings>) => void action.run(async () => {
    await save.mutateAsync({ ...settings, ...patch }); return '设置已保存';
  });
  return <Screen><Heading eyebrow="A SMALL APP, CLEAR BOUNDARIES" title="按自己的节奏阅读" subtitle="数据源、显示偏好和本地数据控制。" />
    {action.message ? <Message text={action.message} error={action.failed} /> : null}
    <Panel><Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>新闻来源</Text>
      <View style={{ gap: 10 }}>
        <Choice label="内置中文教学内容（离线可用）" selected={settings.source === 'demo'} onPress={() => update({ source: 'demo' })} />
        <Choice label="Hacker News 官方 API（真实网络）" selected={settings.source === 'hn'} onPress={() => update({ source: 'hn' })} />
      </View>
      <Body>不需要 API Key。不会在失败后悄悄切回示例数据；网络异常会显示缓存标记或错误。HN 不提供站外全文。</Body>
    </Panel>
    <Panel><Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>阅读显示</Text>
      <Body>正文字号</Body><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {([16, 18, 22] as const).map(size => <Choice key={size} label={`${size} px`} selected={settings.fontSize === size} onPress={() => update({ fontSize: size })} />)}
      </View>
      <Body>主题</Body><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {([['system', '跟随系统'], ['light', '浅色'], ['dark', '深色']] as const).map(([theme, label]) => <Choice key={theme} label={label} selected={settings.theme === theme} onPress={() => update({ theme })} />)}
      </View>
    </Panel>
    <Panel><Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>数据与提醒</Text>
      <Button title="仅清理资讯缓存（保留收藏）" secondary disabled={action.busy} onPress={() => void action.run(async () => {
        await client.cancelQueries({ queryKey: ['feed'] }); await storage.clearFeedCache();
        client.removeQueries({ queryKey: ['feed'] }); return '资讯缓存已清除，收藏仍然保留；下次加载会重建缓存';
      })} />
      <Button title="取消全部待触发阅读提醒" secondary disabled={action.busy || Platform.OS === 'web'} onPress={() => void action.run(async () => {
        await cancelAllReminders(); return '已取消全部待触发阅读提醒';
      })} />
      <Body>后台刷新开关在原生实验室。删除应用会删除本地收藏；当前版本未实现账户和跨设备同步。</Body>
    </Panel>
    <Panel><Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>关于这个学习项目</Text>
      <Body>Expo + React Native + TypeScript。UI、用例、来源协议、持久化和原生能力分层；Web 使用独立存储适配器，不冒充原生测试。</Body>
      <Body>默认没有分析追踪、远程推送或收费服务。只有显式配置公开 Sentry DSN 的非开发版本会发送经脱敏的错误事件。</Body>
      <Body>版本 0.1.0 · 代码导航与实验任务见仓库 docs。</Body>
    </Panel>
  </Screen>;
}
