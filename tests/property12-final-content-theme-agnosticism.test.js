/**
 * Property 12: Content Theme-Agnosticism (Final Validation)
 *
 * Final validation across ALL content files ensuring theme portability.
 * Verifies all content files use only standard Hugo front matter and contain
 * no theme-specific logic, so that changing the theme parameter in hugo.toml
 * renders all content without requiring content file modifications.
 *
 * Feature: jekyll-to-hugo-migration, Property 12: Content Theme-Agnosticism
 * Validates: Requirements 16.3, 16.6, 16.7
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
 * These would break when switching to a different Hugo theme.
 */
const THEME_SPECIFIC_BODY_PATTERNS = [
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
  {
    name: 'Hugo Go template variable ({{ .Site or {{ .Params)',
    regex: /\{\{\s*\.(?:Site|Params|Page)\b/,
  },
  {
    name: 'Hugo block definition ({{ block ... }})',
    regex: /\{\{\s*block\s+/,
  },
  {
    name: 'Hugo define block ({{ define ... }})',
    regex: /\{\{\s*define\s+/,
  },
];

describe('Feature: jekyll-to-hugo-migration, Property 12: Content Theme-Agnosticism (Final Validation)', () => {
  let contentFiles = [];

  beforeAll(() => {
    const contentDir = path.resolve('content');
    contentFiles = findMarkdownFiles(contentDir);
  });

  it('should find content files to validate', () => {
    expect(contentFiles.length).toBeGreaterThan(0);
  });

  /**
   * **Validates: Requirements 16.3**
   * All content files use only standard Hugo front matter fields plus allowed custom params.
   */
  it('property: all content files use only standard Hugo front matter fields (100 iterations)', () => {
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
            `  Allowed standard fields: ${[...STANDARD_HUGO_FIELDS].join(', ')}\n` +
            `  Allowed custom params: ${[...ALLOWED_CUSTOM_PARAMS].join(', ')}`
          ).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 16.6**
   * No content file body contains shortcode references, partial calls, or theme-specific template logic.
   */
  it('property: no content file body contains theme-specific logic (100 iterations)', () => {
    expect(contentFiles.length).toBeGreaterThan(0);

    const contentArb = fc.constantFrom(...contentFiles);

    fc.assert(
      fc.property(contentArb, (filePath) => {
        const raw = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);
        const { content: body } = matter(raw);

        for (const pattern of THEME_SPECIFIC_BODY_PATTERNS) {
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

  /**
   * **Validates: Requirements 16.7**
   * All content files have valid parseable front matter — a prerequisite for any theme to render them.
   */
  it('property: all content files have valid parseable YAML front matter (100 iterations)', () => {
    expect(contentFiles.length).toBeGreaterThan(0);

    const contentArb = fc.constantFrom(...contentFiles);

    fc.assert(
      fc.property(contentArb, (filePath) => {
        const raw = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);

        // Parsing should not throw
        let parsed;
        try {
          parsed = matter(raw);
        } catch (e) {
          expect.fail(
            `File "${relativePath}" has invalid front matter that would break theme rendering:\n  ${e.message}`
          );
        }

        // Front matter must be an object (not null/undefined)
        expect(
          parsed.data !== null && typeof parsed.data === 'object',
          `File "${relativePath}" has no valid front matter object`
        ).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 16.7**
   * Content files with a title field use a string value — required for any theme to render headings.
   */
  it('property: content files with title have string values (100 iterations)', () => {
    expect(contentFiles.length).toBeGreaterThan(0);

    const contentArb = fc.constantFrom(...contentFiles);

    fc.assert(
      fc.property(contentArb, (filePath) => {
        const raw = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);
        const { data: frontMatter } = matter(raw);

        if (frontMatter.title !== undefined) {
          expect(
            typeof frontMatter.title === 'string',
            `File "${relativePath}" has non-string title: ${typeof frontMatter.title}`
          ).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Exhaustive validation: every single content file passes all theme-agnosticism checks.
   * This ensures 100% coverage beyond the random sampling of property tests.
   *
   * **Validates: Requirements 16.3, 16.6, 16.7**
   */
  it('exhaustive: every content file is fully theme-agnostic', () => {
    for (const filePath of contentFiles) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);

      // Valid front matter
      let parsed;
      try {
        parsed = matter(raw);
      } catch (e) {
        expect.fail(
          `File "${relativePath}" has invalid front matter: ${e.message}`
        );
      }

      const { data: frontMatter, content: body } = parsed;

      // Only allowed fields
      const fields = Object.keys(frontMatter);
      for (const field of fields) {
        expect(
          ALLOWED_FIELDS.has(field),
          `File "${relativePath}" has disallowed front matter field: "${field}"`
        ).toBe(true);
      }

      // No theme-specific body patterns
      for (const pattern of THEME_SPECIFIC_BODY_PATTERNS) {
        const match = body.match(pattern.regex);
        expect(
          match,
          `File "${relativePath}" contains theme-specific syntax: ${pattern.name}\n` +
          `  Matched: "${match?.[0]}"`
        ).toBeNull();
      }

      // Title is a string if present
      if (frontMatter.title !== undefined) {
        expect(
          typeof frontMatter.title === 'string',
          `File "${relativePath}" has non-string title`
        ).toBe(true);
      }
    }
  });
});
