/**
 * Property 1: Template Liquid-Free
 *
 * For any Hugo template file (in themes/clean-blog/layouts/ or layouts/),
 * the file shall contain zero Liquid template syntax — no {% %} tags,
 * no {{ site.* }} or {{ page.* }} Liquid variable references, and no
 * Liquid filters (e.g., | prepend:, | relative_url, | date:).
 *
 * Feature: jekyll-to-hugo-migration, Property 1: Template Liquid-Free
 * Validates: Requirements 3.3, 3.8, 3.9, 3.10
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';

/**
 * Recursively find all .html files in a directory.
 */
function findHtmlFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Liquid syntax patterns that must NOT appear in Hugo templates.
 *
 * Each pattern has a regex and a human-readable description for error messages.
 */
const LIQUID_PATTERNS = [
  {
    name: 'Liquid block tags ({% ... %})',
    regex: /\{%-?\s*.+?\s*-?%\}/s,
  },
  {
    name: 'Liquid site variable ({{ site.* }})',
    // Matches {{ site.something }} but NOT {{ .Site.Something }} (Hugo syntax)
    regex: /\{\{\s*site\.\w+/,
  },
  {
    name: 'Liquid page variable ({{ page.* }})',
    // Matches {{ page.something }} but NOT {{ .Params.something }} (Hugo syntax)
    regex: /\{\{\s*page\.\w+/,
  },
  {
    name: 'Liquid filter: | prepend:',
    regex: /\|\s*prepend\s*:/,
  },
  {
    name: 'Liquid filter: | relative_url',
    regex: /\|\s*relative_url\b/,
  },
  {
    name: 'Liquid filter: | absolute_url',
    regex: /\|\s*absolute_url\b/,
  },
  {
    name: 'Liquid filter: | date:',
    regex: /\|\s*date\s*:/,
  },
  {
    name: 'Liquid filter: | strip_html',
    regex: /\|\s*strip_html\b/,
  },
  {
    name: 'Liquid filter: | truncatewords',
    regex: /\|\s*truncatewords\b/,
  },
  {
    name: 'Liquid filter: | xml_escape',
    regex: /\|\s*xml_escape\b/,
  },
  {
    name: 'Liquid filter: | date_to_xmlschema',
    regex: /\|\s*date_to_xmlschema\b/,
  },
  {
    name: 'Liquid filter: | normalize_whitespace',
    regex: /\|\s*normalize_whitespace\b/,
  },
  {
    name: 'Liquid filter: | escape',
    // Use word boundary to avoid matching Hugo's "| relURL" etc.
    // Also avoid matching "| xml_escape" (handled above)
    regex: /\|\s*escape\b(?!d)/,
  },
];

describe('Feature: jekyll-to-hugo-migration, Property 1: Template Liquid-Free', () => {
  let templateFiles = [];

  beforeAll(() => {
    const themeLayoutsDir = path.resolve('themes/clean-blog/layouts');
    const projectLayoutsDir = path.resolve('layouts');

    templateFiles = [
      ...findHtmlFiles(themeLayoutsDir),
      ...findHtmlFiles(projectLayoutsDir),
    ];
  });

  it('should find at least one template file to test', () => {
    expect(templateFiles.length).toBeGreaterThan(0);
  });

  it('no Hugo template file contains Liquid syntax (property test, 100 iterations)', () => {
    // Precondition: we must have template files to test
    expect(templateFiles.length).toBeGreaterThan(0);

    // Arbitrary that picks a random template file from the discovered set
    const templateArb = fc.constantFrom(...templateFiles);

    fc.assert(
      fc.property(templateArb, (filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);

        for (const pattern of LIQUID_PATTERNS) {
          const match = content.match(pattern.regex);
          expect(
            match,
            `File "${relativePath}" contains Liquid syntax: ${pattern.name}\n` +
            `  Matched: "${match?.[0]}"`
          ).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('exhaustive check: every template file is Liquid-free', () => {
    for (const filePath of templateFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);

      for (const pattern of LIQUID_PATTERNS) {
        const match = content.match(pattern.regex);
        expect(
          match,
          `File "${relativePath}" contains Liquid syntax: ${pattern.name}\n` +
          `  Matched: "${match?.[0]}"`
        ).toBeNull();
      }
    }
  });
});
