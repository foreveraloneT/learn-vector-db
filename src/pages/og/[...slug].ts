import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';
import { topicCardConfig } from '../../lib/og/topic-card';
import type { Locale } from '../../lib/i18n';

const topics = await getCollection('topics');

const pages = Object.fromEntries(
  topics.map((t) => [
    `${t.data.locale}/${t.data.slug}`,
    {
      title: t.data.title,
      summary: t.data.summary,
      group: t.data.group,
      locale: t.data.locale as Locale,
    },
  ]),
);

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  param: 'slug',
  getImageOptions: (_path, page) => {
    const cfg = topicCardConfig(page);
    return {
      title: cfg.title,
      description: cfg.description,
      bgGradient: cfg.bgGradient,
      font: {
        title: { size: 64, weight: 'Bold', color: [255, 255, 255] },
        description: { size: 32, weight: 'Normal', color: [220, 220, 230] },
      },
    };
  },
});
