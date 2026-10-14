import type { Article } from '../domain/models.ts';
import { safeHttpsUrl, validArticleId } from '../domain/models.ts';
import type { NewsSource } from '../domain/ports.ts';
import { fetchJson, mapConcurrent } from '../domain/http.ts';

const BASE = 'https://hacker-news.firebaseio.com/v0';
const PAGE_SIZE = 15;
export function plainText(input: string): string {
  // This is TEXT extraction, not an HTML sanitizer: the result is rendered only in <Text>.
  return input.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ').replace(/&(?:amp|lt|gt|quot|apos|#39|#x27|nbsp);/gi, entity => {
      const map: Record<string, string> = { '&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'",'&#x27;':"'",'&nbsp;':' ' };
      return map[entity.toLowerCase()] ?? entity;
    }).replace(/\s+/g, ' ').trim();
}
export function parseHnItem(data: unknown): Article | null {
  if (data === null) return null;
  if (!data || typeof data !== 'object') throw new Error('Invalid HN item');
  const a = data as Record<string, unknown>;
  if (a.deleted === true || a.dead === true || a.type !== 'story') return null;
  if (!Number.isSafeInteger(a.id) || Number(a.id) <= 0 || typeof a.title !== 'string' || !a.title.trim() ||
      typeof a.time !== 'number' || !Number.isFinite(a.time) || a.time <= 0 || a.time > 100000000000) throw new Error('Invalid HN story');
  const text = typeof a.text === 'string' ? plainText(a.text).slice(0, 18000) : '';
  const summary = text ? text.slice(0, 280) : '此来源提供新闻标题和原文链接，不提供站外文章正文。请打开原文阅读。';
  return { id: `hn-${a.id}`, source: 'hn', title: plainText(a.title).slice(0, 600), summary,
    paragraphs: text ? [text] : [summary], author: typeof a.by === 'string' ? a.by : 'Hacker News',
    publishedAt: new Date(a.time * 1000).toISOString(), category: '科技资讯',
    bodyKind: 'summary', url: safeHttpsUrl(a.url) ?? `https://news.ycombinator.com/item?id=${a.id}` };
}
function parseIds(data: unknown): number[] {
  if (!Array.isArray(data) || !data.every(id => Number.isSafeInteger(id) && id > 0)) throw new Error('Invalid HN list');
  return data.slice(0, 500);
}
export function createHnSource(): NewsSource {
  // Freeze a ranked ID snapshot while paginating; refresh page 0 starts a new snapshot.
  let snapshot: number[] | null = null;
  return {
    async page(page, signal) {
      if (page === 0 || !snapshot) snapshot = await fetchJson(`${BASE}/topstories.json`, parseIds, signal);
      const ids = snapshot.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
      const items = await mapConcurrent(ids, 4, id => fetchJson(`${BASE}/item/${id}.json`, parseHnItem, signal), signal);
      return { items: items.filter((item): item is Article => item !== null),
        nextPage: (page + 1) * PAGE_SIZE < snapshot.length ? page + 1 : null };
    },
    async article(id, signal) {
      if (!validArticleId(id) || !id.startsWith('hn-')) throw new Error('Invalid HN id');
      const article = await fetchJson(`${BASE}/item/${id.slice(3)}.json`, parseHnItem, signal);
      if (!article) throw new Error('文章已删除或不存在');
      return article;
    },
  };
}
