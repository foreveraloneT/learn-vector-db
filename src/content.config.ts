import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { TOPIC_GROUPS, LOCALES } from './lib/constants';
import { topicSchema } from './lib/content/topic-schema';

export { TOPIC_GROUPS, LOCALES };

const topics = defineCollection({
  loader: glob({
    pattern: '**/*.mdx',
    base: './src/content/topics',
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ''),
  }),
  schema: topicSchema,
});

export const collections = { topics };
