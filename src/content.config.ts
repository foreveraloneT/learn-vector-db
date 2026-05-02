import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

export const TOPIC_GROUPS = ['math', 'vector-db', 'real-world'] as const;
export const LOCALES = ['th', 'en'] as const;

const topics = defineCollection({
  loader: glob({
    pattern: '**/*.mdx',
    base: './src/content/topics',
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ''),
  }),
  schema: z.object({
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
  }),
});

export const collections = { topics };
