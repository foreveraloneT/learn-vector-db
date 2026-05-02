import { LOCALES } from './constants';
import type { Locale } from './i18n';

export interface ValidatableTopic {
  slug: string;
  locale: Locale;
  order: number;
  interactiveComponent?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export function validateTopicParity(
  topics: ValidatableTopic[],
  knownInteractiveComponents: string[],
): ValidationResult {
  const errors: string[] = [];

  // 1. Translation parity: every slug must exist in every locale
  const slugsByLocale = new Map<Locale, Set<string>>();
  for (const locale of LOCALES) slugsByLocale.set(locale, new Set());
  for (const t of topics) slugsByLocale.get(t.locale)?.add(t.slug);

  const allSlugs = new Set(topics.map((t) => t.slug));
  for (const slug of allSlugs) {
    for (const locale of LOCALES) {
      if (!slugsByLocale.get(locale)?.has(slug)) {
        const presentIn = LOCALES.find((l) => slugsByLocale.get(l)?.has(slug));
        errors.push(`Missing translation: slug "${slug}" exists in ${presentIn} but not ${locale}`);
      }
    }
  }

  // 2. Order uniqueness within locale
  for (const locale of LOCALES) {
    const seen = new Map<number, string>();
    for (const t of topics.filter((x) => x.locale === locale)) {
      if (seen.has(t.order)) {
        errors.push(
          `Duplicate order ${t.order} in locale "${locale}": "${seen.get(t.order)}" and "${t.slug}"`,
        );
      } else {
        seen.set(t.order, t.slug);
      }
    }
  }

  // 3. interactiveComponent must resolve
  for (const t of topics) {
    if (t.interactiveComponent && !knownInteractiveComponents.includes(t.interactiveComponent)) {
      errors.push(
        `Unknown interactiveComponent "${t.interactiveComponent}" on "${t.locale}/${t.slug}"`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}
