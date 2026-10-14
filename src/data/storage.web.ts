import type { Article } from '../domain/models.ts';
import { parseArticle, parseCachedPage, parseSettings } from '../domain/models.ts';
import type { Storage } from '../domain/ports.ts';

// Browser preview adapter. Native builds resolve storage.ts (SQLite), never this file.
// This is NOT a SQLite/IndexedDB simulator. Quota/blocked storage errors are shown to the user.
const PREFIX = 'newslab.v1.';
function read<T>(key: string, fallback: T): T {
  const raw = globalThis.localStorage.getItem(PREFIX + key);
  return raw ? JSON.parse(raw) as T : fallback;
}
function write(key: string, value: unknown): void {
  globalThis.localStorage.setItem(PREFIX + key, JSON.stringify(value));
}
export const storage: Storage = {
  async readPage(source, page) {
    const raw = globalThis.localStorage.getItem(`${PREFIX}page.${source}.${page}`);
    if (!raw) return null;
    try { return parseCachedPage(JSON.parse(raw)); } catch { return null; }
  },
  async writePage(source, page, data) { write(`page.${source}.${page}`, data); },
  async findArticle(id) {
    const saved = (await storage.bookmarks()).find(a => a.id === id);
    if (saved) return saved;
    for (const key of Object.keys(globalThis.localStorage).filter(k => k.startsWith(PREFIX + 'page.'))) {
      try {
        const data = parseCachedPage(JSON.parse(globalThis.localStorage.getItem(key)!));
        const found = data.items.find(a => a.id === id);
        if (found) return found;
      } catch { /* Disposable cache only. */ }
    }
    return null;
  },
  async bookmarks() { return read<Article[]>('bookmarks', []).map(parseArticle); },
  async saveBookmark(article) {
    const current = read<Article[]>('bookmarks', []).map(parseArticle);
    write('bookmarks', [parseArticle(article), ...current.filter(a => a.id !== article.id)]);
  },
  async removeBookmark(id) { write('bookmarks', read<Article[]>('bookmarks', []).filter(a => a.id !== id)); },
  async readSettings() { return parseSettings(read('settings', null)); },
  async writeSettings(settings) { write('settings', parseSettings(settings)); },
  async clearFeedCache() {
    Object.keys(globalThis.localStorage).filter(k => k.startsWith(PREFIX + 'page.')).forEach(k => globalThis.localStorage.removeItem(k));
  },
  async getMeta(key) { return read<string | null>(`meta.${key}`, null); },
  async setMeta(key, value) { write(`meta.${key}`, value); },
};
