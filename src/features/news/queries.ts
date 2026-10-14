import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { newsService, storage } from '../../data/runtime';
import type { Article, Settings, Source } from '../../domain/models';

export const keys = {
  feed: (source: Source) => ['feed', source] as const,
  article: (id: string) => ['article', id] as const,
  bookmarks: ['bookmarks'] as const,
  settings: ['settings'] as const,
};
export function useFeed(source: Source) {
  return useInfiniteQuery({ queryKey: keys.feed(source), initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => newsService.page(source, pageParam, signal),
    getNextPageParam: page => page.nextPage ?? undefined,
    networkMode: 'always', // Let the repository serve SQLite even while the device is offline.
  });
}
export function useArticle(id: string) {
  return useQuery({ queryKey: keys.article(id), queryFn: ({ signal }) => newsService.article(id, signal), networkMode: 'always' });
}
export function useBookmarks() {
  return useQuery({ queryKey: keys.bookmarks, queryFn: () => storage.bookmarks(), networkMode: 'always', staleTime: 0 });
}
export function useBookmarkMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ article, saved }: { article: Article; saved: boolean }) => {
      if (saved) await storage.removeBookmark(article.id); else await storage.saveBookmark(article);
    },
    // Do not claim success before the persistent write succeeds.
    onSuccess: async () => { await client.invalidateQueries({ queryKey: keys.bookmarks }); },
    networkMode: 'always',
  });
}
export function useSettingsQuery() {
  return useQuery({ queryKey: keys.settings, queryFn: () => storage.readSettings(), networkMode: 'always', staleTime: Infinity });
}
export function useSaveSettings() {
  const client = useQueryClient();
  return useMutation({ mutationFn: async (settings: Settings) => { await storage.writeSettings(settings); return settings; },
    onSuccess: settings => { client.setQueryData(keys.settings, settings); }, networkMode: 'always' });
}
