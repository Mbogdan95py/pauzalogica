import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CookieBanner } from '@/components/CookieBanner';
import { THEME_BOOTSTRAP_SCRIPT } from '@/lib/client/preferences';
import { siteConfig } from '@/lib/config';
import { websiteJsonLd } from '@/lib/ui/seo';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description:
    'PauzaLogica.ro — jocuri zilnice gratuite de logică și cuvinte în limba română: Sudoku, rebus, cuvinte ascunse, nonograme, kakuro și multe altele. Joacă fără cont.',
  applicationName: siteConfig.name,
  authors: [{ name: 'PauzaLogica.ro' }],
  icons: { icon: '/favicon.svg' },
  manifest: '/site.webmanifest',
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1420' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        {/* Applies saved theme before paint to avoid a flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
        <a href="#continut" className="sr-only-focusable btn-brand fixed left-3 top-3 z-[60]">
          Sari la conținut
        </a>
        <Header />
        <main id="continut" className="flex-1">
          {children}
        </main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
