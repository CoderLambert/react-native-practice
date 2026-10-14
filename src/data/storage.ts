import * as SQLite from 'expo-sqlite';
import type { Storage } from '../domain/ports.ts';
import { parseArticle, parseCachedPage, parseSettings } from '../domain/models.ts';
import { SCHEMA_V1 } from './schema';

let database: Promise<SQLite.SQLiteDatabase> | undefined;
async function open(): Promise<SQLite.SQLiteDatabase> {
  if (!database) {
    database = (async () => {
      const db = await SQLite.openDatabaseAsync('newslab.db');
      try {
        await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
        const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
        const version = row?.user_version ?? 0;
        if (version > 1) throw new Error('数据库版本高于当前应用，请升级应用，勿清除数据');
        if (version < 1) {
          await db.withExclusiveTransactionAsync(async tx => {
            await tx.execAsync(SCHEMA_V1);
            await tx.execAsync('PRAGMA user_version = 1');
          });
        }
        return db;
      } catch (error) { await db.closeAsync(); throw error; }
    })().catch(error => { database = undefined; throw error; });
  }
  return database;
}
// All inputs are bound parameters; source content is never interpolated into SQL.
export const storage: Storage = {
  async readPage(source, page) {
    const row = await (await open()).getFirstAsync<{ payload: string }>(
      'SELECT payload FROM feed_pages WHERE source = ? AND page = ?', source, page);
    if (!row) return null;
    try { return parseCachedPage(JSON.parse(row.payload)); } catch { return null; }
  },
  async writePage(source, page, data) {
    await (await open()).runAsync(
      'INSERT INTO feed_pages (source, page, payload) VALUES (?, ?, ?) ON CONFLICT(source, page) DO UPDATE SET payload = excluded.payload',
      source, page, JSON.stringify(data));
  },
  async findArticle(id) {
    const db = await open();
    const saved = await db.getFirstAsync<{ payload: string }>('SELECT payload FROM bookmarks WHERE id = ?', id);
    // A broken bookmark is reported, not silently removed or replaced with remote content.
    if (saved) return parseArticle(JSON.parse(saved.payload));
    const pages = await db.getAllAsync<{ payload: string }>('SELECT payload FROM feed_pages WHERE source = ?', id.startsWith('hn-') ? 'hn' : 'demo');
    for (const row of pages) {
      try {
        const found = parseCachedPage(JSON.parse(row.payload)).items.find(a => a.id === id);
        if (found) return found;
      } catch { /* Invalid disposable cache is ignored; bookmarks are not touched. */ }
    }
    return null;
  },
  async bookmarks() {
    const rows = await (await open()).getAllAsync<{ payload: string }>('SELECT payload FROM bookmarks ORDER BY saved_at DESC, id');
    return rows.map(row => parseArticle(JSON.parse(row.payload)));
  },
  async saveBookmark(article) {
    const valid = parseArticle(article);
    await (await open()).runAsync(
      'INSERT INTO bookmarks (id, payload, saved_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload',
      valid.id, JSON.stringify(valid), new Date().toISOString());
  },
  async removeBookmark(id) { await (await open()).runAsync('DELETE FROM bookmarks WHERE id = ?', id); },
  async readSettings() { const raw = await storage.getMeta('settings'); return parseSettings(raw ? JSON.parse(raw) : null); },
  async writeSettings(settings) { await storage.setMeta('settings', JSON.stringify(parseSettings(settings))); },
  async clearFeedCache() { await (await open()).runAsync('DELETE FROM feed_pages'); },
  async getMeta(key) {
    return (await (await open()).getFirstAsync<{ value: string }>('SELECT value FROM metadata WHERE key = ?', key))?.value ?? null;
  },
  async setMeta(key, value) {
    await (await open()).runAsync('INSERT INTO metadata (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
  },
};
