/**
 * Property 8: Open Graph Tag Correctness
 *
 * For any page with a combination of title, description, date, background image,
 * and tags, the rendered HTML <head> shall contain the correct Open Graph meta tags
 * (og:title, og:type, og:description, og:url, og:image, article:published_time,
 * article:author, article:section, article:tag), and the meta description shall be
 * at most 160 characters, falling back to the site description when no page excerpt
 * is available.
 *
 * Since we cannot render Hugo templates in JS, this test verifies the template
 * structure in themes/clean-blog/layouts/partials/head.html:
 * 1. All required OG meta tag patterns are present
 * 2. Meta description uses truncate 160 (or similar length limiting)
 * 3. Conditional rendering patterns (with/if blocks) for optional fields
 * 4. Fallback logic for missing page-level metadata
 *
 * Feature: jekyll-to-hugo-migration, Property 8: Open Graph Tag Correctness
 * Validates: Requirements 4.2, 4.3
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';

describe('Feature: jekyll-to-hugo-migration, Property 8: Open Graph Tag Correctness', () => {
  let headContent;

  beforeAll(() => {
    const headPath = path.resolve('themes/clean-blog/layouts/partials/head.html');
    expect(fs.existsSync(headPath), 'head.html partial must exist').toBe(true);
    headContent = fs.readFileSync(headPath, 'utf8');
  });

  /**
   * Required OG meta tags and their expected template patterns.
   */
  const REQUIRED_OG_TAGS = [
    {
      property: 'og:site_name',
      pattern: /property="og:site_name"/,
      description: 'Site name OG tag',
    },
    {
      property: 'og:title',
      pattern: /property="og:title"/,
      description: 'Title OG tag',
    },
    {
      property: 'og:type',
      pattern: /property="og:type"/,
      description: 'Type OG tag (article or website)',
    },
    {
      property: 'og:description',
      pattern: /property="og:description"/,
      description: 'Description OG tag',
    },
    {
      property: 'og:url',
      pattern: /property="og:url"/,
      description: 'URL OG tag',
    },
    {
      property: 'og:image',
      pattern: /property="og:image"/,
      description: 'Image OG tag',
    },
  ];

  const ARTICLE_OG_TAGS = [
    {
      property: 'article:published_time',
      pattern: /property="article:published_time"/,
      description: 'Article published time tag',
    },
    {
      property: 'article:author',
      pattern: /property="article:author"/,
      description: 'Article author tag',
    },
    {
      property: 'article:section',
      pattern: /property="article:section"/,
      description: 'Article section tag',
    },
    {
      property: 'article:tag',
      pattern: /property="article:tag"/,
      description: 'Article tag tag',
    },
  ];

  // --- Structural checks ---

  it('head.html contains all required OG meta tags', () => {
    for (const tag of [...REQUIRED_OG_TAGS, ...ARTICLE_OG_TAGS]) {
      expect(
        tag.pattern.test(headContent),
        `Missing OG tag: ${tag.property} (${tag.description})`,
      ).toBe(true);
    }
  });

  it('meta description uses truncate 160 for length limiting', () => {
    // Hugo's truncate function limits string length
    const truncatePattern = /truncate\s+160/;
    expect(
      truncatePattern.test(headContent),
      'Meta description must use "truncate 160" to limit length to 160 characters',
    ).toBe(true);
  });

  it('meta description has fallback to site description', () => {
    // The template should reference both page description and site description
    const pageDescPattern = /\.Params\.description/;
    const siteDescPattern = /\.Site\.Params\.description/;
    expect(
      pageDescPattern.test(headContent),
      'Meta description should reference .Params.description for page-level description',
    ).toBe(true);
    expect(
      siteDescPattern.test(headContent),
      'Meta description should reference .Site.Params.description as fallback',
    ).toBe(true);
  });

  // --- Conditional rendering checks ---

  it('og:title has conditional rendering with site title fallback', () => {
    // Should have {{ if .Title }} ... {{ else }} ... {{ end }} pattern
    const titleConditional = /\{\{\s*if\s+\.Title\s*\}\}[\s\S]*?property="og:title"[\s\S]*?\{\{\s*else\s*\}\}[\s\S]*?property="og:title"[\s\S]*?\{\{\s*end\s*\}\}/;
    expect(
      titleConditional.test(headContent),
      'og:title must have conditional rendering with fallback to site title',
    ).toBe(true);
  });

  it('og:type uses conditional to distinguish article vs website', () => {
    // Should render "article" for pages with title, "website" otherwise
    const articlePattern = /content="article"\s+property="og:type"/;
    const websitePattern = /content="website"\s+property="og:type"/;
    expect(articlePattern.test(headContent), 'og:type must have "article" option').toBe(true);
    expect(websitePattern.test(headContent), 'og:type must have "website" option').toBe(true);
  });

  it('og:description has conditional rendering with site description fallback', () => {
    const descConditional = /\{\{\s*if\s+\.Params\.description\s*\}\}[\s\S]*?property="og:description"[\s\S]*?\{\{\s*else\s*\}\}[\s\S]*?property="og:description"[\s\S]*?\{\{\s*end\s*\}\}/;
    expect(
      descConditional.test(headContent),
      'og:description must have conditional rendering with fallback to site description',
    ).toBe(true);
  });

  it('og:image has conditional rendering with default background fallback', () => {
    const imageConditional = /\{\{\s*if\s+\.Params\.background\s*\}\}[\s\S]*?property="og:image"[\s\S]*?\{\{\s*else\s*\}\}[\s\S]*?property="og:image"[\s\S]*?\{\{\s*end\s*\}\}/;
    expect(
      imageConditional.test(headContent),
      'og:image must have conditional rendering with fallback to default background',
    ).toBe(true);
  });

  it('article:published_time is conditionally rendered based on date', () => {
    // Should be inside a {{ if not .Date.IsZero }} or {{ with .Date }} block
    const dateConditional = /\{\{\s*if\s+not\s+\.Date\.IsZero\s*\}\}[\s\S]*?property="article:published_time"/;
    expect(
      dateConditional.test(headContent),
      'article:published_time must be conditionally rendered when date is present',
    ).toBe(true);
  });

  it('article:section is conditionally rendered with categories', () => {
    const sectionConditional = /\{\{\s*with\s+\.Params\.categories\s*\}\}[\s\S]*?property="article:section"/;
    expect(
      sectionConditional.test(headContent),
      'article:section must be conditionally rendered with categories',
    ).toBe(true);
  });

  it('article:tag is conditionally rendered with tags', () => {
    const tagConditional = /\{\{\s*if\s+\.Params\.tags\s*\}\}[\s\S]*?property="article:tag"/;
    expect(
      tagConditional.test(headContent),
      'article:tag must be conditionally rendered with tags',
    ).toBe(true);
  });

  // --- Property-based test with random metadata combinations ---

  it('template structure handles any metadata combination (property test, 100+ iterations)', () => {
    /**
     * Generate random page metadata combinations and verify the template
     * has the structural patterns to handle each combination correctly.
     */
    const metadataArb = fc.record({
      hasTitle: fc.boolean(),
      hasDescription: fc.boolean(),
      hasDate: fc.boolean(),
      hasBackground: fc.boolean(),
      hasTags: fc.boolean(),
      hasCategories: fc.boolean(),
      description: fc.string({ minLength: 0, maxLength: 300 }),
      tagCount: fc.integer({ min: 0, max: 10 }),
    });

    fc.assert(
      fc.property(metadataArb, (metadata) => {
        // 1. og:site_name is always present (unconditional)
        expect(
          /property="og:site_name"/.test(headContent),
          'og:site_name must always be present',
        ).toBe(true);

        // 2. og:title: template must handle both present and absent title
        if (metadata.hasTitle) {
          // When title exists, should render page title
          expect(
            /\{\{\s*if\s+\.Title\s*\}\}[\s\S]*?content="\{\{\s*\.Title\s*\}\}"[\s\S]*?property="og:title"/.test(headContent),
            'When title is present, og:title should use .Title',
          ).toBe(true);
        } else {
          // When title is absent, should fall back to site title
          expect(
            /\{\{\s*else\s*\}\}[\s\S]*?content="\{\{\s*\.Site\.Title\s*\}\}"[\s\S]*?property="og:title"/.test(headContent),
            'When title is absent, og:title should fall back to .Site.Title',
          ).toBe(true);
        }

        // 3. og:type: template must distinguish article vs website
        if (metadata.hasTitle) {
          expect(
            /content="article"\s+property="og:type"/.test(headContent),
            'Pages with title should have og:type=article option',
          ).toBe(true);
        } else {
          expect(
            /content="website"\s+property="og:type"/.test(headContent),
            'Pages without title should have og:type=website option',
          ).toBe(true);
        }

        // 4. og:description: template must handle page vs site description
        if (metadata.hasDescription) {
          expect(
            /\.Params\.description/.test(headContent),
            'Template must reference .Params.description',
          ).toBe(true);
        } else {
          expect(
            /\.Site\.Params\.description/.test(headContent),
            'Template must reference .Site.Params.description as fallback',
          ).toBe(true);
        }

        // 5. og:url: should use .Permalink
        expect(
          /\{\{\s*\.Permalink\s*\}\}[\s\S]*?property="og:url"/.test(headContent) ||
          /property="og:url"[\s\S]*?\{\{\s*\.Permalink\s*\}\}/.test(headContent) ||
          /content="\{\{\s*\.Permalink\s*\}\}"\s+property="og:url"/.test(headContent),
          'og:url must use .Permalink',
        ).toBe(true);

        // 6. og:image: template must handle page background vs default
        if (metadata.hasBackground) {
          expect(
            /\{\{\s*if\s+\.Params\.background\s*\}\}/.test(headContent),
            'Template must check for .Params.background',
          ).toBe(true);
        } else {
          expect(
            /\.Site\.Params\.defaultBackground/.test(headContent),
            'Template must fall back to .Site.Params.defaultBackground',
          ).toBe(true);
        }

        // 7. article:published_time: only when date is present
        if (metadata.hasDate) {
          expect(
            /if\s+not\s+\.Date\.IsZero/.test(headContent),
            'Template must conditionally render article:published_time based on date',
          ).toBe(true);
        }

        // 8. article:tag: template must handle tags with range
        if (metadata.hasTags) {
          expect(
            /\{\{\s*range\s+\.Params\.tags\s*\}\}/.test(headContent),
            'Template must iterate over .Params.tags with range',
          ).toBe(true);
        }

        // 9. article:section: template must handle categories
        if (metadata.hasCategories) {
          expect(
            /\{\{\s*with\s+\.Params\.categories\s*\}\}/.test(headContent),
            'Template must conditionally render article:section with categories',
          ).toBe(true);
        }

        // 10. Meta description must use truncate 160
        expect(
          /truncate\s+160/.test(headContent),
          'Meta description must use truncate 160',
        ).toBe(true);

        // 11. Verify meta description length constraint is applied to both paths
        // (page description and site description fallback)
        const metaDescLine = headContent.match(/<meta\s+name="description"[^>]*>/);
        expect(metaDescLine, 'Must have a meta description tag').not.toBeNull();
        expect(
          /truncate\s+160/.test(metaDescLine[0]),
          'Meta description tag must apply truncate 160',
        ).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
