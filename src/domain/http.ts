export type FailureKind = 'network' | 'timeout' | 'http' | 'cancelled' | 'payload';
export class RequestError extends Error {
  readonly kind: FailureKind;
  readonly status?: number;
  constructor(kind: FailureKind, message: string, status?: number) {
    super(message); this.name = 'RequestError'; this.kind = kind; this.status = status;
  }
}
export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new RequestError('cancelled', '请求已取消');
}
export function retryable(error: unknown): boolean {
  return error instanceof RequestError &&
    (error.kind === 'network' || error.kind === 'timeout' ||
      (error.kind === 'http' && (error.status ?? 0) >= 500));
}
export async function fetchJson<T>(
  url: string, parse: (data: unknown) => T, signal?: AbortSignal,
  options: { fetcher?: typeof fetch; timeoutMs?: number } = {},
): Promise<T> {
  throwIfAborted(signal);
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, options.timeoutMs ?? 12000);
  try {
    const response = await (options.fetcher ?? fetch)(url, {
      signal: controller.signal, headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new RequestError('http', response.status === 429 ? '来源限流，请稍后手动重试' : `来源返回 HTTP ${response.status}`, response.status);
    }
    // Limit decoded payload as well as Content-Length; do not accept an unbounded feed.
    const declared = Number(response.headers.get('content-length') ?? 0);
    if (declared > 2000000) throw new RequestError('payload', '来源响应过大');
    const text = await response.text();
    if (text.length > 2000000) throw new RequestError('payload', '来源响应过大');
    throwIfAborted(signal);
    try { return parse(JSON.parse(text)); }
    catch { throw new RequestError('payload', '来源数据格式不符合约定'); }
  } catch (error) {
    if (signal?.aborted) throw new RequestError('cancelled', '请求已取消');
    if (timedOut) throw new RequestError('timeout', '请求超时，请检查网络');
    if (error instanceof RequestError) throw error;
    throw new RequestError('network', '网络不可用，请检查连接');
  } finally {
    clearTimeout(timer); signal?.removeEventListener('abort', cancel);
  }
}
export async function mapConcurrent<T, R>(
  items: T[], limit: number, fn: (item: T) => Promise<R>, signal?: AbortSignal,
): Promise<R[]> {
  if (!Number.isInteger(limit) || limit < 1) throw new Error('Invalid concurrency');
  const result: R[] = new Array(items.length);
  let cursor = 0;
  let failed = false;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (!failed) {
      throwIfAborted(signal);
      const index = cursor++;
      if (index >= items.length) return;
      try { result[index] = await fn(items[index]!); }
      catch (error) { failed = true; throw error; }
    }
  }));
  return result;
}
