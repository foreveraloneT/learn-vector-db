import { LOCALES } from './constants';

export type Locale = (typeof LOCALES)[number];

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function getOtherLocale(locale: Locale): Locale {
  return locale === 'th' ? 'en' : 'th';
}

export function buildTopicPath(locale: Locale, slug: string): string {
  const prefix = locale === 'th' ? '' : '/en';
  if (!slug) return prefix === '' ? '/' : `${prefix}/`;
  return `${prefix}/${slug}`;
}

export function getOtherLocaleUrl(currentLocale: Locale, slug: string): string {
  return buildTopicPath(getOtherLocale(currentLocale), slug);
}
