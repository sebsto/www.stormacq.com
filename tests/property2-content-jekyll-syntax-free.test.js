/**
 * Property 2: Content Jekyll-Syntax-Free
 *
 * For any migrated content file in content/, the file shall contain no
 * Jekyll-specific syntax — no {% highlight %}...{% endhighlight %} blocks,
 * no {:target="_blank"} Kramdown attribute syntax, and no Liquid template tags.
 *
 * Feature: jekyll-to-hugo-migration, Property 2: Content Jekyll-Syntax-Free
 * Validates: Requirements 6.3, 6.4, 15.5
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';

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
 * Jekyll-specific syntax patterns that must NOT appear in Hugo content files.
 *
 * Note: Hugo shortcodes like {{< ... >}} and {{% ... %}} are valid Hugo syntax
 * and must NOT be flagged. Only Liquid-style {{ ... }} variable tags are invalid.
 */
const JEKYLL_PATTERNS = [
  {
    name: 'Jekyll highlight block ({% highlight ... %})',
    regex: /\{%[-\s]*highlight\b/,
  },
  {
    name: 'Jekyll endhighlight block ({% endhighlight %})',
    regex: /\{%[-\s]*endhighlight\s*-?%\}/,
  },
  {
    name: 'Kramdown attribute syntax ({:target="_blank"})',
    regex: /\{:\s*target\s*=\s*"_blank"\s*\}/,
  },
  {
    name: 'Kramdown attribute syntax ({: ... })',
    regex: /\{:\s*\.\w+/,
  },
  {
    name: 'Liquid template tag ({% ... %})',
    // Matches {% ... %} but NOT Hugo shortcodes {{< ... >}} or {{% ... %}}
    regex: /\{%-?\s*(?!%})\S+.*?-?%\}/s,
  },
  {
    name: 'Liquid variable tag ({{ ... }}) — not Hugo shortcode',
    // Matches {{ ... }} but NOT Hugo shortcodes {{< ... >}} or {{% ... %}}
    // Hugo shortcodes start with {{< or {{% immediately after the opening braces
    regex: /\{\{(?![<%])\s*[^}]+\}\}/,
  },
];

describe('Feature: jekyll-to-hugo-migration, Property 2: Content Jekyll-Syntax-Free', () => {
  let contentFiles = [];

  beforeAll(() => {
    const contentDir = path.resolve('content');
    contentFiles = findMarkdownFiles(contentDir);
  });

  it('should find at least one content file to test', () => {
    expect(contentFiles.length).toBeGreaterThan(0);
  });

  it('no content file contains Jekyll-specific syntax (property test, 100 iterations)', () => {
    expect(contentFiles.length).toBeGreaterThan(0);

    const contentArb = fc.constantFrom(...contentFiles);

    fc.assert(
      fc.property(contentArb, (filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);

        for (const pattern of JEKYLL_PATTERNS) {
          const match = content.match(pattern.regex);
          expect(
            match,
            `File "${relativePath}" contains Jekyll syntax: ${pattern.name}\n` +
            `  Matched: "${match?.[0]}"`
          ).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('exhaustive check: every content file is Jekyll-syntax-free', () => {
    for (const filePath of contentFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);

      for (const pattern of JEKYLL_PATTERNS) {
        const match = content.match(pattern.regex);
        expect(
          match,
          `File "${relativePath}" contains Jekyll syntax: ${pattern.name}\n` +
          `  Matched: "${match?.[0]}"`
        ).toBeNull();
      }
    }
  });
});
