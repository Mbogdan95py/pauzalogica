import type { MetadataRoute } from 'next';
import { listDates } from '@/lib/storage/content';
import { datesWithGame } from '@/lib/storage/queries';
import { GAME_ROUTES } from '@/lib/ui/nav';
import { absoluteUrl } from '@/lib/ui/seo';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths = [
    '/',
    '/jocuri',
    '/arhiva',
    '/despre',
    '/contact',
    '/sugestii',
    '/confidentialitate',
    '/cookie-uri',
    '/termeni',
  ];

  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : 0.6,
  }));

  // Game landing pages + every game's dated pages.
  for (const { slug, type } of GAME_ROUTES) {
    entries.push({ url: absoluteUrl(`/${slug}`), lastModified: now, changeFrequency: 'daily', priority: 0.8 });
    for (const date of datesWithGame(type)) {
      entries.push({ url: absoluteUrl(`/${slug}/${date}`), lastModified: new Date(date), changeFrequency: 'monthly', priority: 0.5 });
    }
  }

  // Archive day pages.
  for (const date of listDates()) {
    entries.push({ url: absoluteUrl(`/arhiva/${date}`), lastModified: new Date(date), changeFrequency: 'monthly', priority: 0.4 });
  }

  return entries;
}
