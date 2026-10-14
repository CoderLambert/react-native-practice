import { NewsService } from '../domain/news-service';
import { demoSource } from './demo-source';
import { createHnSource } from './hn-source';
import { storage } from './storage';

export { storage };
// The only composition root: substitute a provider here; screens do not change.
export const newsService = new NewsService(storage, { demo: demoSource, hn: createHnSource() });
