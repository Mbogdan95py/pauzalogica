import type { Metadata } from 'next';
import { siteConfig } from '@/lib/config';

const BASE = siteConfig.url.replace(/\/$/, '');

export function absoluteUrl(path: string): string {
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export interface PageSeo {
  title: string;
  description: string;
  path: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
}

/** Build consistent per-page metadata (canonical, Open Graph, Twitter). */
export function buildMetadata({ title, description, path, ogType = 'website', noindex }: PageSeo): Metadata {
  const url = absoluteUrl(path);
  // The root layout's title template appends " · Careu.ro", so `title` stays
  // bare here; the OG/Twitter titles get the full form explicitly.
  const ogTitle = `${title} · ${siteConfig.name}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: ogType,
      title: ogTitle,
      description,
      url,
      siteName: siteConfig.name,
      locale: 'ro_RO',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: BASE,
    inLanguage: 'ro-RO',
    description: siteConfig.tagline,
  };
}

export function gameJsonLd(params: { name: string; description: string; path: string; datePublished: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: params.name,
    description: params.description,
    url: absoluteUrl(params.path),
    inLanguage: 'ro-RO',
    datePublished: params.datePublished,
    isAccessibleForFree: true,
  };
}
