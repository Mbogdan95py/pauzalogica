/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static-first: the site is exported to plain HTML/JS so it can be hosted
  // cheaply on Vercel, Cloudflare Pages, Netlify or any static host.
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    // next/image optimization is not available on a static export.
    unoptimized: true,
  },
  eslint: {
    // Linting runs as its own CI step (`npm run lint`); don't fail the build on it.
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pauzalogica.ro',
  },
};

export default nextConfig;
