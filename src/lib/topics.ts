import { TOPIC_GROUPS } from './constants';
import type { Locale } from './i18n';

export type TopicGroup = (typeof TOPIC_GROUPS)[number];

export interface TopicSummary {
  slug: string;
  title: string;
  group: TopicGroup;
  order: number;
  locale: Locale;
}

export interface SidebarGroup {
  group: TopicGroup;
  topics: TopicSummary[];
}

export function getNeighbors(
  topics: TopicSummary[],
  currentOrder: number,
): { prev: TopicSummary | null; next: TopicSummary | null } {
  const sorted = [...topics].sort((a, b) => a.order - b.order);
  const prev = [...sorted].reverse().find(t => t.order < currentOrder) ?? null;
  const next = sorted.find(t => t.order > currentOrder) ?? null;
  return { prev, next };
}

export function groupTopicsForSidebar(topics: TopicSummary[]): SidebarGroup[] {
  return TOPIC_GROUPS
    .map(group => ({
      group,
      topics: topics
        .filter(t => t.group === group)
        .sort((a, b) => a.order - b.order),
    }))
    .filter(g => g.topics.length > 0);
}
