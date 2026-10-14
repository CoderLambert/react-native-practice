export type Source = 'demo' | 'hn';
export type Category = '移动开发' | '工程实践' | '产品设计' | '科技资讯';
export type Article = {
  id: string;
  source: Source;
  title: string;
  summary: string;
  paragraphs: string[];
  author: string;
  publishedAt: string;
  category: Category;
  bodyKind: 'full' | 'summary';
  url?: string;
};
export type Page = { items: Article[]; nextPage: number | null };
export type CachedPage = Page & { savedAt: string };
export type FeedResult = Page & {
  origin: 'demo' | 'network' | 'cache';
  savedAt: string;
  warning?: string;
};
export type Settings = { source: Source; fontSize: 16 | 18 | 22; theme: 'system' | 'light' | 'dark' };
export const DEFAULT_SETTINGS: Settings = { source: 'demo', fontSize: 18, theme: 'system' };
export const CATEGORIES: Category[] = ['移动开发', '工程实践', '产品设计', '科技资讯'];

export function validArticleId(id: unknown): id is string {
  return typeof id === 'string' && /^(demo-[1-9]\d{0,3}|hn-[1-9]\d{0,11})$/.test(id);
}
export function safeHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 2048) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}
export function parseSettings(value: unknown): Settings {
  const s = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    source: s.source === 'hn' ? 'hn' : 'demo',
    fontSize: s.fontSize === 16 || s.fontSize === 22 ? s.fontSize : 18,
    theme: s.theme === 'dark' || s.theme === 'light' ? s.theme : 'system',
  };
}
export function parseArticle(value: unknown): Article {
  if (!value || typeof value !== 'object') throw new Error('Invalid article');
  const a = value as Record<string, unknown>;
  if (!validArticleId(a.id) || (a.source !== 'demo' && a.source !== 'hn') ||
      !a.id.startsWith(`${a.source}-`) || typeof a.title !== 'string' || !a.title.trim() ||
      a.title.length > 600 || typeof a.summary !== 'string' || a.summary.length > 3000 ||
      typeof a.author !== 'string' || typeof a.publishedAt !== 'string' ||
      !Number.isFinite(Date.parse(a.publishedAt)) ||
      !CATEGORIES.includes(a.category as Category) ||
      (a.bodyKind !== 'full' && a.bodyKind !== 'summary') || !Array.isArray(a.paragraphs) ||
      a.paragraphs.length > 200 || !a.paragraphs.every(p => typeof p === 'string' && p.length <= 20000)) {
    throw new Error('Invalid article contract');
  }
  return { id: a.id, source: a.source, title: a.title, summary: a.summary,
    paragraphs: a.paragraphs as string[], author: a.author, publishedAt: a.publishedAt,
    category: a.category as Category, bodyKind: a.bodyKind, url: safeHttpsUrl(a.url) };
}
export function parseCachedPage(value: unknown): CachedPage {
  if (!value || typeof value !== 'object') throw new Error('Invalid cached page');
  const p = value as Record<string, unknown>;
  if (!Array.isArray(p.items) || p.items.length > 50 || typeof p.savedAt !== 'string' ||
      !Number.isFinite(Date.parse(p.savedAt)) ||
      !(p.nextPage === null || (Number.isInteger(p.nextPage) && Number(p.nextPage) >= 1))) {
    throw new Error('Invalid cached page contract');
  }
  return { items: p.items.map(parseArticle), nextPage: p.nextPage as number | null, savedAt: p.savedAt };
}
export function filterArticles(articles: Article[], search: string, category: string): Article[] {
  const term = search.trim().toLocaleLowerCase();
  const seen = new Set<string>();
  return articles.filter(a => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return (category === '全部' || a.category === category) &&
      (!term || `${a.title} ${a.summary} ${a.author}`.toLocaleLowerCase().includes(term));
  });
}
export function articleIdFromNotification(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const id = (data as Record<string, unknown>).articleId;
  return validArticleId(id) ? id : null;
}
