/**
 * Property 3: Blog Post URL Pattern Preservation
 *
 * For any blog post with a given date (year, month, day) and slug, Hugo shall
 * generate the post URL matching the pattern `/:year/:month/:day/:slug/`,
 * identical to the Jekyll URL structure.
 *
 * This test:
 * 1. Uses the Hugo build output already in `public/`
 * 2. Lists all non-draft blog posts from `content/posts/`
 * 3. For each post, extracts the date (year, month, day) from front matter
 * 4. Verifies that `public/:year/:month/:day/:slug/index.html` exists
 *
 * Feature: jekyll-to-hugo-migration, Property 3: Blog Post URL Pattern Preservation
 * Validates: Requirements 2.2, 6.6
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

describe('Feature: jekyll-to-hugo-migration, Property 3: Blog Post URL Pattern Preservation', () => {
  let publishedPosts;

  /**
   * Replicate Hugo's slug generation from a title string.
   * Hugo lowercases, replaces spaces and certain punctuation with hyphens,
   * collapses multiple hyphens, and trims leading/trailing hyphens.
   * Accented characters (e.g. é) are preserved by default.
   */
  function hugoSlugify(title) {
    return title
      .toLowerCase()
      .replace(/[&:'"!?,;@#$%^*()+=\[\]{}|\\<>\/~`]/g, '') // remove punctuation
      .replace(/[\s_]+/g, '-')  // spaces and underscores to hyphens
      .replace(/-{2,}/g, '-')   // collapse multiple hyphens
      .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
  }

  /**
   * Load all non-draft blog posts from content/posts/.
   * Returns an array of { filename, title, date, year, month, day, slug } objects.
   */
  function loadPublishedPosts() {
    const postsDir = path.resolve('content/posts');
    const files = fs.readdirSync(postsDir).filter(
      (f) => f.endsWith('.md') && f !== '_index.md'
    );

    return files
      .map((filename) => {
        const filePath = path.join(postsDir, filename);
        const content = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(content);

        if (data.draft === true) return null;

        // Extract date from front matter (Hugo uses front matter date for permalinks)
        const postDate = new Date(data.date);
        const year = String(postDate.getFullYear());
        const month = String(postDate.getMonth() + 1).padStart(2, '0');
        const day = String(postDate.getDate()).padStart(2, '0');

        // Hugo generates slug from title when no explicit slug is set
        const slug = data.slug || hugoSlugify(data.title);

        return { filename, title: data.title, date: data.date, year, month, day, slug };
      })
      .filter(Boolean);
  }

  beforeAll(() => {
    const publicDir = path.resolve('public');
    expect(
      fs.existsSync(publicDir),
      'public/ directory must exist — run Hugo build first: container run --rm --volume="$PWD:/src" hugo-site hugo --minify'
    ).toBe(true);

    publishedPosts = loadPublishedPosts();
    expect(publishedPosts.length).toBeGreaterThan(0);
  });

  it('every blog post URL matches /:year/:month/:day/:slug/ pattern (property test, 100+ iterations)', () => {
    /**
     * Validates: Requirements 2.2, 6.6
     *
     * For each randomly selected published post, verify that Hugo generated
     * an index.html at the expected URL path: public/:year/:month/:day/:slug/index.html
     */
    const postIndexArb = fc.integer({ min: 0, max: publishedPosts.length - 1 });

    fc.assert(
      fc.property(postIndexArb, (index) => {
        const post = publishedPosts[index];
        const expectedPath = path.resolve('public', post.year, post.month, post.day, post.slug, 'index.html');

        expect(
          fs.existsSync(expectedPath),
          `Blog post "${post.title}" (${post.filename}) should have output at ` +
          `/${post.year}/${post.month}/${post.day}/${post.slug}/index.html ` +
          `but file not found at: ${expectedPath}`
        ).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('all blog post output directories follow the /:year/:month/:day/:slug/ structure', () => {
    /**
     * Validates: Requirements 2.2, 6.6
     *
     * Exhaustive check: every published post must have its output at the
     * correct URL path following the /:year/:month/:day/:slug/ pattern.
     */
    for (const post of publishedPosts) {
      const expectedPath = path.resolve('public', post.year, post.month, post.day, post.slug, 'index.html');

      expect(
        fs.existsSync(expectedPath),
        `Blog post "${post.title}" (${post.filename}) should have output at ` +
        `/${post.year}/${post.month}/${post.day}/${post.slug}/index.html`
      ).toBe(true);
    }
  });

  it('blog post URL date components match front matter date', () => {
    /**
     * Validates: Requirements 2.2
     *
     * Verify that the year/month/day in the URL path are derived from
     * the front matter date, not the filename date.
     */
    for (const post of publishedPosts) {
      const outputDir = path.join('public', post.year, post.month, post.day);

      expect(
        fs.existsSync(path.resolve(outputDir)),
        `Output directory ${outputDir} should exist for post "${post.title}" with date ${post.date}`
      ).toBe(true);

      // Verify the year directory contains the expected month
      const yearDir = path.resolve('public', post.year);
      const monthDirs = fs.readdirSync(yearDir);
      expect(
        monthDirs,
        `Year directory ${post.year}/ should contain month ${post.month}/`
      ).toContain(post.month);
    }
  });

  it('no blog post output exists outside the /:year/:month/:day/:slug/ pattern', () => {
    /**
     * Validates: Requirements 2.2, 6.6
     *
     * Verify that all blog post index.html files in the public/ directory
     * follow the /:year/:month/:day/:slug/ URL pattern (4 levels deep under a year dir).
     */
    const publicDir = path.resolve('public');
    const yearDirPattern = /^20\d{2}$/;

    const yearDirs = fs.readdirSync(publicDir).filter((d) => {
      return yearDirPattern.test(d) && fs.statSync(path.join(publicDir, d)).isDirectory();
    });

    for (const yearDir of yearDirs) {
      const yearPath = path.join(publicDir, yearDir);
      const monthDirs = fs.readdirSync(yearPath).filter((d) =>
        fs.statSync(path.join(yearPath, d)).isDirectory()
      );

      for (const monthDir of monthDirs) {
        // Month should be 2-digit zero-padded
        expect(monthDir, `Month directory "${monthDir}" should be 2-digit zero-padded`).toMatch(/^\d{2}$/);

        const monthPath = path.join(yearPath, monthDir);
        const dayDirs = fs.readdirSync(monthPath).filter((d) =>
          fs.statSync(path.join(monthPath, d)).isDirectory()
        );

        for (const dayDir of dayDirs) {
          // Day should be 2-digit zero-padded
          expect(dayDir, `Day directory "${dayDir}" should be 2-digit zero-padded`).toMatch(/^\d{2}$/);

          const dayPath = path.join(monthPath, dayDir);
          const slugDirs = fs.readdirSync(dayPath).filter((d) =>
            fs.statSync(path.join(dayPath, d)).isDirectory()
          );

          for (const slugDir of slugDirs) {
            // Each slug directory should contain an index.html
            const indexPath = path.join(dayPath, slugDir, 'index.html');
            expect(
              fs.existsSync(indexPath),
              `Slug directory ${yearDir}/${monthDir}/${dayDir}/${slugDir}/ should contain index.html`
            ).toBe(true);
          }
        }
      }
    }
  });
});
