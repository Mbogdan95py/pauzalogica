import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/ui/seo';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/status-content', '/setari'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
