import type { Article, CachedPage, Page, Settings, Source } from './models.ts';

// The application layer depends on contracts, not SQLite, React or Android.
export interface NewsSource {
  page(page: number, signal?: AbortSignal): Promise<Page>;
  article(id: string, signal?: AbortSignal): Promise<Article>;
}
export interface Storage {
  readPage(source: Source, page: number): Promise<CachedPage | null>;
  writePage(source: Source, page: number, data: CachedPage): Promise<void>;
  findArticle(id: string): Promise<Article | null>;
  bookmarks(): Promise<Article[]>;
  saveBookmark(article: Article): Promise<void>;
  removeBookmark(id: string): Promise<void>;
  readSettings(): Promise<Settings>;
  writeSettings(settings: Settings): Promise<void>;
  clearFeedCache(): Promise<void>;
  getMeta(key: string): Promise<string | null>;
  setMeta(key: string, value: string): Promise<void>;
}
