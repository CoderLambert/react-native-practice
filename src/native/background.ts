import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { newsService, storage } from '../data/runtime';

const TASK = 'newslab.refresh.v1';
TaskManager.defineTask(TASK, async () => {
  try {
    const settings = await storage.readSettings();
    const page = await newsService.page(settings.source, 0);
    const ok = page.origin !== 'cache' && !page.warning;
    await storage.setMeta('background.last', JSON.stringify({ at: new Date().toISOString(), ok,
      message: ok ? `已更新 ${page.items.length} 篇 · ${settings.source}` : '未得到新的可持久化内容，仍保留旧缓存' }));
    return ok ? BackgroundTask.BackgroundTaskResult.Success : BackgroundTask.BackgroundTaskResult.Failed;
  } catch {
    try { await storage.setMeta('background.last', JSON.stringify({ at: new Date().toISOString(), ok: false, message: '刷新失败，旧数据未删除' })); }
    catch { /* OS receives failure even if storage itself is unavailable. */ }
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});
export async function backgroundStatus() {
  return { registered: await TaskManager.isTaskRegisteredAsync(TASK),
    available: await BackgroundTask.getStatusAsync() === BackgroundTask.BackgroundTaskStatus.Available,
    last: await storage.getMeta('background.last') };
}
export async function setBackgroundEnabled(enabled: boolean) {
  if (!enabled) { await BackgroundTask.unregisterTaskAsync(TASK); return; }
  if (await BackgroundTask.getStatusAsync() !== BackgroundTask.BackgroundTaskStatus.Available) throw new Error('系统当前不允许后台任务');
  await BackgroundTask.registerTaskAsync(TASK, { minimumInterval: 30 });
}
export async function testBackgroundTask() {
  if (!__DEV__) throw new Error('仅开发构建可手动触发后台测试');
  if (!await TaskManager.isTaskRegisteredAsync(TASK)) throw new Error('请先启用后台刷新');
  const accepted = await BackgroundTask.triggerTaskWorkerForTestingAsync();
  if (!accepted) throw new Error('系统未接受本次测试请求');
}
