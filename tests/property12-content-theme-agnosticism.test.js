/**
 * Property 12: Content Theme-Agnosticism
 *
 * For any content file in content/, the file shall use only standard Hugo
 * front matter fields (title, date, description, tags, draft, images, url,
 * type, aliases) plus generic custom params (subtitle, author, background),
 * and shall contain no shortcode references, partial calls, or theme-specific
 * template logic in the body.
 *
 * Feature: jekyll-to-hugo-migration, Property 12: Content Theme-Agnosticism
 * Validates: Requirements 16.3, 16.6
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

/**
 * Recursively find all .md files in a directory.
 */
function findMarkdownFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Standard Hugo front matter fields that any stock theme understands.
 */
const STANDARD_HUGO_FIELDS = new Set([
  'title',
  'date',
  'description',
  'tags',
  'draft',
  'images',
  'url',
  'type',
  'aliases',
]);

/**
 * Allowed generic custom params that are theme-agnostic.
 * These are accessed via .Params and gracefully ignored by other themes.
 */
const ALLOWED_CUSTOM_PARAMS = new Set([
  'subtitle',
  'author',
  'background',
]);

const ALLOWED_FIELDS = new Set([...STANDARD_HUGO_FIELDS, ...ALLOWED_CUSTOM_PARAMS]);

/**
 * Patterns that indicate theme-specific logic in content body.
 */
const THEME_SPECIFIC_PATTERNS = [
  {
    name: 'Hugo shortcode ({{< ... >}})',
    regex: /\{\{<\s*.+?\s*>\}\}/s,
  },
  {
    name: 'Hugo shortcode ({{% ... %}})',
    regex: /\{\{%\s*.+?\s*%\}\}/s,
  },
  {
    name: 'Hugo partial call ({{ partial ... }})',
    regex: /\{\{\s*partial\s+/,
  },
  {
    name: 'Hugo template logic ({{ template ... }})',
    regex: /\{\{\s*template\s+/,
  },
];

describe('Feature: jekyll-to-hugo-migration, Property 12: Content Theme-Agnosticism', () => {
  let contentFiles = [];

  beforeAll(() => {
    const contentDir = path.resolve('content');
    contentFiles = findMarkdownFiles(contentDir);
  });

  it('should find at least one content file to test', () => {
    expect(contentFiles.length).toBeGreaterThan(0);
  });

  it('all content files use only allowed front matter fields (property test, 100 iterations)', () => {
    expect(contentFiles.length).toBeGreaterThan(0);

    const contentArb = fc.constantFrom(...contentFiles);

    fc.assert(
      fc.property(contentArb, (filePath) => {
        const raw = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);
        const { data: frontMatter } = matter(raw);

        const fields = Object.keys(frontMatter);
        for (const field of fields) {
          expect(
            ALLOWED_FIELDS.has(field),
            `File "${relativePath}" has disallowed front matter field: "${field}"\n` +
            `  Allowed fields: ${[...ALLOWED_FIELDS].join(', ')}`
          ).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('no content file body contains shortcode references or theme-specific logic (property test, 100 iterations)', () => {
    expect(contentFiles.length).toBeGreaterThan(0);

    const contentArb = fc.constantFrom(...contentFiles);

    fc.assert(
      fc.property(contentArb, (filePath) => {
        const raw = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);
        const { content: body } = matter(raw);

        for (const pattern of THEME_SPECIFIC_PATTERNS) {
          const match = body.match(pattern.regex);
          expect(
            match,
            `File "${relativePath}" contains theme-specific syntax: ${pattern.name}\n` +
            `  Matched: "${match?.[0]}"`
          ).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('exhaustive check: every content file uses only allowed front matter fields', () => {
    for (const filePath of contentFiles) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);
      const { data: frontMatter } = matter(raw);

      const fields = Object.keys(frontMatter);
      for (const field of fields) {
        expect(
          ALLOWED_FIELDS.has(field),
          `File "${relativePath}" has disallowed front matter field: "${field}"\n` +
          `  Allowed fields: ${[...ALLOWED_FIELDS].join(', ')}`
        ).toBe(true);
      }
    }
  });

  it('exhaustive check: no content file body contains theme-specific syntax', () => {
    for (const filePath of contentFiles) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);
      const { content: body } = matter(raw);

      for (const pattern of THEME_SPECIFIC_PATTERNS) {
        const match = body.match(pattern.regex);
        expect(
          match,
          `File "${relativePath}" contains theme-specific syntax: ${pattern.name}\n` +
          `  Matched: "${match?.[0]}"`
        ).toBeNull();
      }
    }
  });
});
