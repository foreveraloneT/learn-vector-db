/// <reference types="node" />
import type { AstroIntegration } from 'astro';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import matter from 'gray-matter';
import { validateTopicParity, type ValidatableTopic } from '../lib/validate-topics';

export async function listIslandComponents(srcRoot: URL): Promise<string[]> {
  const islandsDir = join(fileURLToPath(srcRoot), 'components', 'islands');
  try {
    const entries = await readdir(islandsDir);
    return entries.filter((f) => f.endsWith('.svelte')).map((f) => f.replace(/\.svelte$/, ''));
  } catch {
    return []; // no islands directory yet → empty allow-list
  }
}

export async function listTopicFrontmatter(srcRoot: URL): Promise<ValidatableTopic[]> {
  const root = join(fileURLToPath(srcRoot), 'content', 'topics');
  const result: ValidatableTopic[] = [];
  for (const locale of ['th', 'en'] as const) {
    let files: string[] = [];
    try {
      files = await readdir(join(root, locale));
    } catch {
      continue;
    }
    for (const file of files) {
      if (!file.endsWith('.mdx')) continue;
      const raw = await readFile(join(root, locale, file), 'utf-8');
      const { data } = matter(raw);
      result.push({
        slug: String(data.slug),
        locale,
        order: Number(data.order),
        interactiveComponent: data.interactiveComponent
          ? String(data.interactiveComponent)
          : undefined,
      });
    }
  }
  return result;
}

export function validateTopicsIntegration(): AstroIntegration {
  return {
    name: 'validate-topics',
    hooks: {
      'astro:build:start': async ({ logger }) => {
        const srcRoot = new URL('./src/', `file://${process.cwd()}/`);
        const [topics, islands] = await Promise.all([
          listTopicFrontmatter(srcRoot),
          listIslandComponents(srcRoot),
        ]);
        const result = validateTopicParity(topics, islands);
        if (!result.ok) {
          for (const err of result.errors) logger.error(err);
          throw new Error(`Topic validation failed with ${result.errors.length} error(s)`);
        }
        logger.info(`Topic validation passed (${topics.length} topics, ${islands.length} islands)`);
      },
    },
  };
}
