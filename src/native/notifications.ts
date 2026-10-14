import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import type { Article } from '../domain/models';
import { articleIdFromNotification } from '../domain/models';
import { reportError } from '../observability';

const CHANNEL = 'reading-reminders';
Notifications.setNotificationHandler({ handleNotification: async () => ({
  shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false,
}) });
export async function remindArticle(article: Article): Promise<void> {
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: '阅读提醒', importance: Notifications.AndroidImportance.DEFAULT,
  });
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync();
  const permitted = permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!permitted) throw new Error('通知权限未允许；文章副本已收藏，可在系统设置中启用通知后重试');
  await Notifications.scheduleNotificationAsync({ identifier: `read-${article.id}`,
    content: { title: '回到刚才的阅读', body: article.title, data: { articleId: article.id } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10, channelId: CHANNEL },
  });
}
export async function cancelArticleReminder(id: string) { await Notifications.cancelScheduledNotificationAsync(`read-${id}`); }
export async function cancelAllReminders() { await Notifications.cancelAllScheduledNotificationsAsync(); }
export function useNotificationRouting() {
  const handled = useRef(new Set<string>());
  useEffect(() => {
    let alive = true;
    function handle(response: Notifications.NotificationResponse | null) {
      if (!alive || !response) return;
      const key = `${response.notification.request.identifier}:${response.notification.date}`;
      const id = articleIdFromNotification(response.notification.request.content.data);
      if (!id || handled.current.has(key)) return;
      handled.current.add(key);
      router.push({ pathname: '/article/[id]', params: { id } });
      void Notifications.clearLastNotificationResponseAsync().catch(reportError);
    }
    const subscription = Notifications.addNotificationResponseReceivedListener(handle);
    void Notifications.getLastNotificationResponseAsync().then(handle).catch(reportError);
    return () => { alive = false; subscription.remove(); };
  }, []);
}
