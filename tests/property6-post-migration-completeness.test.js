/**
 * Property 6: Blog Post Migration Completeness
 *
 * Verify that content/posts/ contains properly migrated blog posts with
 * correct front matter fields and non-empty content bodies.
 *
 * Note: Originally this test compared _posts/ to content/posts/. After Jekyll cleanup
 * (Task 14.1), it validates content/posts/ directly — ensuring all posts have correct
 * front matter mappings (no layout field, draft instead of published, images array
 * when background exists) and non-empty Markdown content.
 *
 * Feature: jekyll-to-hugo-migration, Property 6: Blog Post Migration Completeness
 * Validates: Requirements 6.1, 6.2
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const POSTS_TARGET_DIR = 'content/posts';

/**
 * Build a list of migrated post files in content/posts/.
 * Excludes _index.md (section list page).
 */
function getPostFiles() {
  if (!fs.existsSync(POSTS_TARGET_DIR)) return [];

  return fs.readdirSync(POSTS_TARGET_DIR)
    .filter(f => (f.endsWith('.md') || f.endsWith('.markdown')) && f !== '_index.md')
    .map(f => ({
      file: f,
      filePath: path.join(POSTS_TARGET_DIR, f),
      label: f,
    }));
}

describe('Feature: jekyll-to-hugo-migration, Property 6: Blog Post Migration Completeness', () => {
  let postFiles = [];

  beforeAll(() => {
    postFiles = getPostFiles();
  });

  it('should find migrated post files in content/posts/', () => {
    expect(postFiles.length).toBeGreaterThan(0);
  });

  it('randomly sampled posts have correct Hugo front matter (property test, 100 iterations)', () => {
    const postArb = fc.constantFrom(...postFiles);

    fc.assert(
      fc.property(postArb, ({ filePath, label }) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = matter(content);
        const fm = parsed.data;

        // 1. `layout` field should not be present (Hugo uses lookup order)
        expect(
          fm.layout,
          `"${label}": Hugo post should not have "layout" field`
        ).toBeUndefined();

        // 2. title must be present
        expect(
          fm.title,
          `"${label}": post must have a title`
        ).toBeDefined();

        // 3. date must be present
        expect(
          fm.date,
          `"${label}": post must have a date`
        ).toBeDefined();

        // 4. If background exists, images array should also exist
        if (fm.background) {
          expect(
            fm.images,
            `"${label}": images array should be added when background exists`
          ).toBeDefined();
          expect(
            Array.isArray(fm.images),
            `"${label}": images should be an array`
          ).toBe(true);
          expect(
            fm.images.length,
            `"${label}": images array should have at least one entry`
          ).toBeGreaterThan(0);
        }

        // 5. draft should be boolean if present
        if (fm.draft !== undefined) {
          expect(
            typeof fm.draft,
            `"${label}": draft should be a boolean`
          ).toBe('boolean');
        }

        // 6. Content body should not be empty
        expect(
          parsed.content.trim().length,
          `"${label}": Markdown content body should not be empty`
        ).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('exhaustive check: every post has correct front matter', () => {
    for (const { filePath, label } of postFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fm = matter(content).data;

      // layout should not be present
      expect(fm.layout, `"${label}": layout should not be present`).toBeUndefined();

      // title and date required
      expect(fm.title, `"${label}": title required`).toBeDefined();
      expect(fm.date, `"${label}": date required`).toBeDefined();

      // background → images mapping
      if (fm.background) {
        expect(fm.images, `"${label}": images array added`).toBeDefined();
        expect(Array.isArray(fm.images), `"${label}": images is array`).toBe(true);
      }

      // Preserved fields should have correct types
      if (fm.tags) {
        expect(Array.isArray(fm.tags), `"${label}": tags should be an array`).toBe(true);
      }
    }
  });
});
