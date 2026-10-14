import type { Article, FeedResult, Source } from './models.ts';
import { validArticleId } from './models.ts';
import type { NewsSource, Storage } from './ports.ts';
import { RequestError, throwIfAborted } from './http.ts';

export class NewsService {
  private readonly storage: Storage;
  private readonly sources: Record<Source, NewsSource>;
  constructor(storage: Storage, sources: Record<Source, NewsSource>) {
    this.storage = storage; this.sources = sources;
  }
  async page(source: Source, page: number, signal?: AbortSignal): Promise<FeedResult> {
    if (!Number.isInteger(page) || page < 0 || page > 40) throw new Error('Invalid page');
    throwIfAborted(signal);
    try {
      const result = await this.sources[source].page(page, signal);
      throwIfAborted(signal);
      const cached = { ...result, savedAt: new Date().toISOString() };
      let warning: string | undefined;
      try { await this.storage.writePage(source, page, cached); }
      catch { warning = '内容已获取，但本地缓存写入失败；请检查存储空间'; }
      return { ...cached, origin: source === 'demo' ? 'demo' : 'network', warning };
    } catch (error) {
      // Cancellation must never be disguised as a successful cache fallback.
      throwIfAborted(signal);
      if (error instanceof RequestError && error.kind === 'cancelled') throw error;
      const cached = await this.storage.readPage(source, page);
      throwIfAborted(signal);
      if (cached) return { ...cached, origin: 'cache', warning: '刷新失败，正在显示本地缓存，不代表最新新闻' };
      throw error;
    }
  }
  async article(id: string, signal?: AbortSignal): Promise<Article> {
    if (!validArticleId(id)) throw new Error('无效的文章地址');
    throwIfAborted(signal);
    const stored = await this.storage.findArticle(id);
    throwIfAborted(signal);
    if (stored) return stored;
    return this.sources[id.startsWith('hn-') ? 'hn' : 'demo'].article(id, signal);
  }
}
