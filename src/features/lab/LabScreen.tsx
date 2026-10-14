import { Platform, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { device } from '../../native/device';
import { backgroundStatus, setBackgroundEnabled, testBackgroundTask } from '../../native/background';
import { Body, Button, Failure, Heading, Message, Panel, Screen } from '../../ui/components';
import { useAction } from '../../ui/use-action';
import { useTheme } from '../../ui/theme';

export function LabScreen() {
  const c = useTheme();
  const action = useAction();
  const snapshot = useQuery({ queryKey: ['native-snapshot'], queryFn: () => device.snapshot(), enabled: device.supported, staleTime: 0, networkMode: 'always' });
  const background = useQuery({ queryKey: ['background-status'], queryFn: backgroundStatus, staleTime: 0, networkMode: 'always' });
  const s = snapshot.data;
  return <Screen><Heading eyebrow="TYPESCRIPT → EXPO MODULES → KOTLIN" title="原生实验室" subtitle="把平台能力变成可点击、可观察、可追踪到源码的实验。" />
    {action.message ? <Message text={action.message} error={action.failed} /> : null}
    <Panel><Text accessibilityRole="header" style={{ color: c.text, fontWeight: '700', fontSize: 20 }}>01 / Android 系统状态</Text>
      <Body>自写 Kotlin 模块读取 BatteryManager、PowerManager、ActivityManager 和 Build，不使用网页模拟数据。</Body>
      {!device.supported ? <Message text={device.reason} /> : s ? <Body>{`${s.manufacturer} ${s.model}\nAndroid ${s.androidVersion} / API ${s.sdk}\n电量：${s.batteryPercent === null ? '未知' : `${s.batteryPercent}%`}\n省电模式：${s.powerSaveMode ? '开启' : '关闭'}\n可用内存：${s.availableMemoryMb} / ${s.totalMemoryMb} MiB`}</Body> : null}
      {snapshot.isError ? <Failure error={snapshot.error} /> : null}
      <Button title={snapshot.isFetching ? '正在读取…' : '读取系统状态'} disabled={!device.supported || snapshot.isFetching} onPress={() => void snapshot.refetch()} />
      <Button title="打开本应用的 Android 系统设置" secondary disabled={!device.supported || action.busy} onPress={() => void action.run(async () => { await device.openSettings(); })} />
      <Body>源码：modules/news-device/android → src/native/device.ts。设备信息仅本地展示，默认不上传。</Body>
    </Panel>
    <Panel><Text accessibilityRole="header" style={{ color: c.text, fontWeight: '700', fontSize: 20 }}>02 / 系统调度后台刷新</Text>
      <Body>Android 使用 WorkManager；iOS 使用系统后台任务。请求最短间隔 30 分钟，不保证准点执行。仅同步当前来源首页，不发送推送。</Body>
      <Message text={`注册状态：${background.data?.registered ? '已启用' : '未启用'} · ${background.data?.available ? '系统服务可用' : '暂不可用 / 正在读取'}`} />
      <Body>{background.data?.last ? `最近实际执行记录：\n${background.data.last}` : '尚无执行记录。注册成功不等于已执行。'}</Body>
      {background.isError ? <Failure error={background.error} /> : null}
      <Button title={background.data?.registered ? '关闭后台刷新' : '启用后台刷新'} disabled={action.busy || !background.data?.available} onPress={() => void action.run(async () => {
        await setBackgroundEnabled(!background.data?.registered); await background.refetch(); return '已更新后台任务注册状态';
      })} />
      {__DEV__ ? <Button title="开发构建：触发一次后台测试" secondary disabled={action.busy || !background.data?.registered || Platform.OS === 'web'} onPress={() => void action.run(async () => {
        await testBackgroundTask(); await background.refetch(); return '已请求系统执行测试；点击刷新状态查看实际结果';
      })} /> : null}
      <Button title="刷新任务状态" secondary disabled={background.isFetching} onPress={() => void background.refetch()} />
      <Body>源码：src/native/background.ts。任务在入口顶层定义，未访问实验室也可被系统唤醒。</Body>
    </Panel>
    <Panel><Text accessibilityRole="header" style={{ color: c.text, fontWeight: '700', fontSize: 20 }}>03 / 带着任务去阅读</Text>
      <Body>在文章页体验系统分享、语音朗读、本地通知与通知深链。Android 开发构建还可切换阅读保持亮屏，退出文章后自动清理窗口标志。</Body>
      <Body>建议依次观察 JS 调用、权限状态、系统界面、应用前后台变化，再读 docs/03-native-lab.md。</Body>
    </Panel>
  </Screen>;
}
