import type { Article } from '../domain/models';
export async function remindArticle(_article: Article): Promise<void> { throw new Error('本地通知请在 Android / iOS Development Build 中测试'); }
export async function cancelArticleReminder(_id: string): Promise<void> { throw new Error('浏览器预览不支持此原生通知功能'); }
export async function cancelAllReminders(): Promise<void> { throw new Error('浏览器预览不支持此原生通知功能'); }
export function useNotificationRouting(): void { /* No native notifications in browser preview. */ }
