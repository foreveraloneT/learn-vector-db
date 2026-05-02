import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  listTopicFrontmatter,
  listIslandComponents,
  checkMdxBodyMentions,
} from './validate-topics';

let workDir: string;

beforeAll(async () => {
  workDir = await mkdtemp(join(tmpdir(), 'lvdb-fixture-'));
  await mkdir(join(workDir, 'src', 'content', 'topics', 'th'), { recursive: true });
  await mkdir(join(workDir, 'src', 'content', 'topics', 'en'), { recursive: true });
  await mkdir(join(workDir, 'src', 'components', 'islands'), { recursive: true });
});

afterAll(async () => {
  await rm(workDir, { recursive: true, force: true });
});

function srcRoot(): URL {
  return new URL('./src/', `file://${workDir}/`);
}

async function writeTopic(locale: 'th' | 'en', file: string, fm: Record<string, unknown>) {
  const yaml = Object.entries(fm)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? `"${v}"` : v}`)
    .join('\n');
  await writeFile(
    join(workDir, 'src', 'content', 'topics', locale, file),
    `---\n${yaml}\n---\nbody\n`,
  );
}

describe('listTopicFrontmatter', () => {
  it('returns nothing when topic dirs are empty', async () => {
    const result = await listTopicFrontmatter(srcRoot());
    expect(result).toEqual([]);
  });

  it('reads slug, locale, order, and interactiveComponent from frontmatter', async () => {
    await writeTopic('th', '01-vector.mdx', {
      slug: 'vector',
      order: 1,
      interactiveComponent: 'VectorPlayground',
    });
    await writeTopic('en', '01-vector.mdx', {
      slug: 'vector',
      order: 1,
      interactiveComponent: 'VectorPlayground',
    });
    const result = await listTopicFrontmatter(srcRoot());
    expect(result).toHaveLength(2);
    expect(result.find((t) => t.locale === 'th')).toMatchObject({
      slug: 'vector',
      order: 1,
      interactiveComponent: 'VectorPlayground',
    });
  });

  it('skips non-MDX files in the topics directory', async () => {
    await writeFile(join(workDir, 'src', 'content', 'topics', 'th', 'README.md'), '# notes');
    const result = await listTopicFrontmatter(srcRoot());
    expect(result).toHaveLength(2); // still 2 — the .md file is ignored
  });
});

describe('listIslandComponents', () => {
  it('returns empty when the islands dir has only non-svelte files', async () => {
    await writeFile(join(workDir, 'src', 'components', 'islands', '.gitkeep'), '');
    const result = await listIslandComponents(srcRoot());
    expect(result).toEqual([]);
  });

  it('returns names without the .svelte extension', async () => {
    await writeFile(join(workDir, 'src', 'components', 'islands', 'Foo.svelte'), '');
    await writeFile(join(workDir, 'src', 'components', 'islands', 'Bar.svelte'), '');
    const result = (await listIslandComponents(srcRoot())).sort();
    expect(result).toEqual(['Bar', 'Foo']);
  });

  it('returns empty when the islands dir does not exist', async () => {
    const otherDir = await mkdtemp(join(tmpdir(), 'lvdb-no-islands-'));
    try {
      const result = await listIslandComponents(new URL('./src/', `file://${otherDir}/`));
      expect(result).toEqual([]);
    } finally {
      await rm(otherDir, { recursive: true, force: true });
    }
  });
});

describe('checkMdxBodyMentions', () => {
  it('returns true when the body contains the component JSX tag', () => {
    expect(checkMdxBodyMentions('VectorPlayground', '<VectorPlayground client:visible />')).toBe(
      true,
    );
  });

  it('returns true with no whitespace before attributes', () => {
    expect(checkMdxBodyMentions('Foo', '<Foo/>')).toBe(true);
  });

  it('returns false when the body does not mention the component', () => {
    expect(checkMdxBodyMentions('VectorPlayground', '## Heading\n\nplain prose')).toBe(false);
  });

  it('does not match a substring of another component name', () => {
    expect(checkMdxBodyMentions('Foo', '<FooBar />')).toBe(false);
  });
});
