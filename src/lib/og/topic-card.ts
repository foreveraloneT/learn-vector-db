import { groupLabels } from '../labels';
import type { Locale } from '../i18n';

export interface TopicCardInput {
  title: string;
  summary: string;
  group: 'math' | 'vector-db' | 'real-world';
  locale: Locale;
}

export interface TopicCardConfig {
  title: string;
  description: string;
  eyebrow: string;
  width: number;
  height: number;
  bgGradient: [number, number, number][];
}

const BRAND_DARK: [number, number, number] = [22, 24, 51]; // brand-900-ish
const BRAND_MID: [number, number, number] = [55, 70, 160]; // brand-500-ish

/**
 * Pure card-config factory. Used by both the unit test and the Astro
 * endpoint that renders the PNG via astro-og-canvas. Keeping it pure
 * means we can pin layout decisions in tests without spinning up the
 * canvas backend (which is slow and DOM-dependent).
 */
export function topicCardConfig(input: TopicCardInput): TopicCardConfig {
  return {
    title: input.title,
    description: input.summary,
    eyebrow: groupLabels[input.group][input.locale],
    width: 1200,
    height: 630,
    bgGradient: [BRAND_DARK, BRAND_MID],
  };
}
