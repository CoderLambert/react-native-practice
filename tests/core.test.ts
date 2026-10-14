import test from 'node:test';
import assert from 'node:assert/strict';
import { articleIdFromNotification, filterArticles, parseArticle, parseCachedPage, parseSettings, safeHttpsUrl, validArticleId } from '../src/domain/models.ts';
import { fetchJson, mapConcurrent, RequestError, retryable } from '../src/domain/http.ts';
import { NewsService } from '../src/domain/news-service.ts';
import { speechChunks } from '../src/domain/reading.ts';
import { DEMO_ARTICLES, demoSource } from '../src/data/demo-source.ts';
import { parseHnItem, plainText } from '../src/data/hn-source.ts';
import type { Storage, NewsSource } from '../src/domain/ports.ts';
import type { Article, CachedPage, Settings, Source } from '../src/domain/models.ts';

class MemoryStorage implements Storage {
  pages = new Map<string, CachedPage>(); saved = new Map<string, Article>(); meta = new Map<string, string>();
  settings: Settings = parseSettings(null);
  async readPage(s: Source, p: number) { return this.pages.get(`${s}:${p}`) ?? null; }
  async writePage(s: Source, p: number, data: CachedPage) { this.pages.set(`${s}:${p}`, data); }
  async findArticle(id: string) { return this.saved.get(id) ?? [...this.pages.values()].flatMap(p => p.items).find(a => a.id === id) ?? null; }
  async bookmarks() { return [...this.saved.values()]; }
  async saveBookmark(a: Article) { this.saved.set(a.id, a); }
  async removeBookmark(id: string) { this.saved.delete(id); }
  async readSettings() { return this.settings; }
  async writeSettings(s: Settings) { this.settings = s; }
  async clearFeedCache() { this.pages.clear(); }
  async getMeta(key: string) { return this.meta.get(key) ?? null; }
  async setMeta(key: string, value: string) { this.meta.set(key, value); }
}
const first = DEMO_ARTICLES[0]!;
const fail: NewsSource = { async page() { throw new RequestError('network', 'offline'); }, async article() { throw new Error('missing'); } };
const fakeFetch = (response: Response): typeof fetch => async () => response;

test('all original demo articles satisfy the contract', () => DEMO_ARTICLES.forEach(a => assert.deepEqual(parseArticle(a), { ...a, url: undefined })));
test('demo pagination has no overlap', async () => {
  const a = await demoSource.page(0); const b = await demoSource.page(1);
  assert.equal(new Set([...a.items, ...b.items].map(a => a.id)).size, DEMO_ARTICLES.length);
  assert.equal(a.nextPage, 1); assert.equal(b.nextPage, null);
});
test('article contract rejects source/id mismatch and excessive content', () => {
  assert.throws(() => parseArticle({ ...first, source: 'hn' }));
  assert.throws(() => parseArticle({ ...first, paragraphs: ['a'.repeat(20001)] }));
});
test('article contract rejects invalid dates and missing titles', () => {
  assert.throws(() => parseArticle({ ...first, publishedAt: 'invalid' }));
  assert.throws(() => parseArticle({ ...first, title: '' }));
});
test('URL boundary rejects javascript, cleartext and credentials', () => {
  for (const url of ['javascript:alert(1)', 'intent://test', 'http://example.com', 'https://a:b@example.com', 'not a URL']) assert.equal(safeHttpsUrl(url), undefined);
  assert.equal(safeHttpsUrl('https://example.com'), 'https://example.com/');
});
test('notification routes accept article IDs, never arbitrary destinations', () => {
  assert.equal(articleIdFromNotification({ articleId: 'demo-1' }), 'demo-1');
  for (const value of [null, {}, { articleId: '../../settings' }, { articleId: 'https://evil.test' }]) assert.equal(articleIdFromNotification(value), null);
});
test('IDs are bounded and nonzero', () => {
  assert.equal(validArticleId('hn-123'), true);
  for (const id of ['hn-0', 'hn-01', 'demo-0001', 'hn-1234567890123', 'demo-1/x']) assert.equal(validArticleId(id), false);
});
test('settings parser repairs unknown values', () => {
  assert.deepEqual(parseSettings({ source: 'evil', theme: 'bright', fontSize: 200 }), parseSettings(null));
  assert.deepEqual(parseSettings({ source: 'hn', theme: 'dark', fontSize: 22 }), { source: 'hn', theme: 'dark', fontSize: 22 });
});
test('search is case-insensitive, trimmed and deduplicated', () => {
  assert.equal(filterArticles([first, first], ' REACT ', '全部').length, 1);
  assert.equal(filterArticles([first], '', '产品设计').length, 0);
});
test('corrupt cache is rejected', () => {
  assert.throws(() => parseCachedPage({ items: [null], nextPage: null, savedAt: new Date().toISOString() }));
  assert.throws(() => parseCachedPage({ items: [], nextPage: -1, savedAt: 'bad' }));
});
test('HN link stories never fabricate full text', () => {
  const item = parseHnItem({ id: 42, title: 'News', type: 'story', time: 1700000000, url: 'https://example.org' });
  assert.equal(item?.bodyKind, 'summary'); assert.match(item!.summary, /不提供/);
});
test('HN deleted and dead stories are omitted', () => {
  assert.equal(parseHnItem(null), null);
  assert.equal(parseHnItem({ deleted: true }), null);
  assert.equal(parseHnItem({ dead: true }), null);
});
test('HN rejects malformed records', () => { assert.throws(() => parseHnItem({ type: 'story', id: '42', time: 0, title: '' })); });
test('HN text is rendered as text, not HTML', () => {
  assert.equal(plainText('<script>bad()</script><p>A &amp; B</p>'), 'A & B');
  const item = parseHnItem({ type: 'story', id: 42, time: 1700000000, title: 'A', text: '<p>Hello</p>', url: 'javascript:bad()' });
  assert.deepEqual(item?.paragraphs, ['Hello']); assert.match(item!.url!, /^https:\/\/news.ycombinator.com/);
});
test('network success persists a cache page', async () => {
  const store = new MemoryStorage(); const service = new NewsService(store, { demo: demoSource, hn: fail });
  const result = await service.page('demo', 0);
  assert.equal(result.origin, 'demo'); assert.equal((await store.readPage('demo', 0))?.items.length, 3);
});
test('offline fallback reports stale origin and keeps timestamp', async () => {
  const store = new MemoryStorage(); const cached = { items: [first], nextPage: null, savedAt: '2026-10-01T00:00:00.000Z' };
  await store.writePage('hn', 0, cached);
  const result = await new NewsService(store, { demo: demoSource, hn: fail }).page('hn', 0);
  assert.equal(result.origin, 'cache'); assert.equal(result.savedAt, cached.savedAt); assert.ok(result.warning);
});
test('offline first load with no cache exposes failure', async () => {
  await assert.rejects(new NewsService(new MemoryStorage(), { demo: demoSource, hn: fail }).page('hn', 0), /offline/);
});
test('cancelled requests never return cached success', async () => {
  const store = new MemoryStorage(); await store.writePage('hn', 0, { items: [first], nextPage: null, savedAt: new Date().toISOString() });
  const controller = new AbortController(); controller.abort();
  await assert.rejects(new NewsService(store, { demo: demoSource, hn: fail }).page('hn', 0, controller.signal), e => e instanceof RequestError && e.kind === 'cancelled');
});
test('disk-full failure keeps fetched content and exposes warning', async () => {
  const store = new MemoryStorage(); store.writePage = async () => { throw new Error('disk full'); };
  const result = await new NewsService(store, { demo: demoSource, hn: fail }).page('demo', 0);
  assert.equal(result.items.length, 3); assert.match(result.warning!, /写入失败/);
});
test('cache clearing preserves explicitly saved snapshots', async () => {
  const store = new MemoryStorage(); await store.saveBookmark(first);
  await store.writePage('demo', 0, { items: [first], nextPage: null, savedAt: new Date().toISOString() });
  await store.clearFeedCache(); assert.equal((await store.bookmarks()).length, 1); assert.equal(await store.readPage('demo', 0), null);
});
test('deep link reads saved article without consulting remote source', async () => {
  const store = new MemoryStorage(); await store.saveBookmark(first);
  assert.deepEqual(await new NewsService(store, { demo: fail, hn: fail }).article(first.id), first);
});
test('invalid deep links and pages are rejected', async () => {
  const service = new NewsService(new MemoryStorage(), { demo: demoSource, hn: fail });
  await assert.rejects(service.article('../../secrets')); await assert.rejects(service.page('demo', -1));
});
test('fetch boundary parses JSON and validates the payload', async () => {
  assert.equal(await fetchJson('https://test', value => Number(value), undefined, { fetcher: fakeFetch(new Response('42')) }), 42);
  await assert.rejects(fetchJson('https://test', () => { throw new Error('bad'); }, undefined, { fetcher: fakeFetch(new Response('{}')) }), e => e instanceof RequestError && e.kind === 'payload');
});
test('429 is not automatically retried', async () => {
  await assert.rejects(fetchJson('https://test', value => value, undefined, { fetcher: fakeFetch(new Response('', { status: 429 })) }), e => e instanceof RequestError && e.status === 429 && !retryable(e));
  assert.equal(retryable(new RequestError('http', 'server', 503)), true);
  assert.equal(retryable(new RequestError('payload', 'bad')), false);
});
test('fetch timeout is distinct from network and user cancellation', async () => {
  const fetcher: typeof fetch = async (_input, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  });
  await assert.rejects(fetchJson('https://test', a => a, undefined, { fetcher, timeoutMs: 5 }), e => e instanceof RequestError && e.kind === 'timeout');
});
test('oversized payload is rejected', async () => {
  await assert.rejects(fetchJson('https://test', a => a, undefined, { fetcher: fakeFetch(new Response('{}', { headers: { 'content-length': '3000000' } })) }), e => e instanceof RequestError && e.kind === 'payload');
});
test('concurrency is bounded and output order preserved', async () => {
  let active = 0, peak = 0;
  const result = await mapConcurrent([0,1,2,3,4,5,6,7], 3, async n => {
    active++; peak = Math.max(peak, active); await new Promise(resolve => setTimeout(resolve, 2)); active--; return n * 2;
  });
  assert.equal(peak, 3); assert.deepEqual(result, [0,2,4,6,8,10,12,14]);
});
test('invalid concurrency is rejected', async () => { await assert.rejects(mapConcurrent([], 0, async n => n)); });
test('speech chunking handles empty input, long text and Unicode', () => {
  assert.deepEqual(speechChunks('  '), []);
  const input = '你好🙂'.repeat(2000); const chunks = speechChunks(input);
  assert.equal(chunks.join(''), input); assert.ok(chunks.every(s => Array.from(s).length <= 2200));
  assert.throws(() => speechChunks('a', 0));
});
test('cancellation while reading a saved article is not a successful response', async () => {
  const store = new MemoryStorage(); const controller = new AbortController();
  store.findArticle = async () => { controller.abort(); return first; };
  await assert.rejects(new NewsService(store, { demo: demoSource, hn: fail }).article(first.id, controller.signal),
    error => error instanceof RequestError && error.kind === 'cancelled');
});
test('cancellation during cache fallback is preserved', async () => {
  const store = new MemoryStorage(); const controller = new AbortController();
  store.readPage = async () => { controller.abort(); return { items: [first], nextPage: null, savedAt: new Date().toISOString() }; };
  await assert.rejects(new NewsService(store, { demo: demoSource, hn: fail }).page('hn', 0, controller.signal),
    error => error instanceof RequestError && error.kind === 'cancelled');
});
