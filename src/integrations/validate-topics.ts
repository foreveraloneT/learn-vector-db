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

export interface TopicFile extends ValidatableTopic {
  body: string;
}

export async function listTopicFrontmatter(srcRoot: URL): Promise<TopicFile[]> {
  const root = join(fileURLToPath(srcRoot), 'content', 'topics');
  const result: TopicFile[] = [];
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
      const { data, content } = matter(raw);
      result.push({
        slug: String(data.slug),
        locale,
        order: Number(data.order),
        interactiveComponent: data.interactiveComponent
          ? String(data.interactiveComponent)
          : undefined,
        body: content,
      });
    }
  }
  return result;
}

/**
 * Returns true when the MDX body contains a JSX opening tag for `component`.
 * Uses a word-boundary check so `<Foo>` does not falsely match `<FooBar />`.
 */
export function checkMdxBodyMentions(component: string, body: string): boolean {
  return new RegExp(`<${component}\\b`).test(body);
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

        // Check that every topic declaring an interactiveComponent actually uses it in the MDX body.
        const bodyErrors: string[] = [];
        for (const topic of topics) {
          if (
            topic.interactiveComponent &&
            !checkMdxBodyMentions(topic.interactiveComponent, topic.body)
          ) {
            bodyErrors.push(
              `Topic ${topic.locale}/${topic.slug} declares interactiveComponent ${topic.interactiveComponent} but body does not use it`,
            );
          }
        }
        if (bodyErrors.length > 0) {
          for (const err of bodyErrors) logger.error(err);
          throw new Error(`Topic validation failed with ${bodyErrors.length} MDX body error(s)`);
        }

        logger.info(
          `Topic validation passed (${topics.length} topics, ${islands.length} islands, MDX usage verified)`,
        );
      },
    },
  };
}
