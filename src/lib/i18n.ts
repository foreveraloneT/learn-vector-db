import { LOCALES } from './constants';

export type Locale = (typeof LOCALES)[number];

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function getOtherLocale(locale: Locale): Locale {
  return locale === 'th' ? 'en' : 'th';
}

export function buildTopicPath(locale: Locale, slug: string): string {
  // import.meta.env.BASE_URL ends with '/' in both Astro builds and Vitest.
  // Strip the trailing slash so we can cleanly compose: '/learn-vector-db/'
  // becomes '/learn-vector-db'; '/' becomes '' so root-domain deploys (and
  // Vitest's default) emit the same paths as before.
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const prefix = locale === 'th' ? '' : '/en';
  if (!slug) return `${base}${prefix}/`;
  return `${base}${prefix}/${slug}`;
}

export function getOtherLocaleUrl(currentLocale: Locale, slug: string): string {
  return buildTopicPath(getOtherLocale(currentLocale), slug);
}
