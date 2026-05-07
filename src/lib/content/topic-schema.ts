import { z } from 'astro/zod';
import { TOPIC_GROUPS, LOCALES } from '../constants';

/**
 * Zod schema for a single topic's frontmatter.
 *
 * Single source of truth — `src/content.config.ts` re-exports this and wires
 * it into the Astro content collection. Anyone wanting to assert frontmatter
 * shape in a unit test should import from here, not from `content.config.ts`.
 */
export const topicSchema = z.object({
  title: z.string(),
  slug: z.string(),
  group: z.enum(TOPIC_GROUPS),
  order: z.number().int().positive(),
  locale: z.enum(LOCALES),
  summary: z.string(),
  hasInteractive: z.boolean().default(false),
  interactiveComponent: z.string().optional(),
  hasMath: z.boolean().default(false),
  updated: z.coerce.date().optional(),
});

export type TopicFrontmatter = z.infer<typeof topicSchema>;
