/**
 * Property 4: URL Parity Across All Content
 *
 * For each page/post in the Jekyll source, verify the Hugo output produces
 * a file at the same URL path, ensuring no broken links after migration.
 *
 * This test:
 * 1. Uses the Hugo build output already in `public/` from previous test runs
 * 2. Defines the expected URLs that the Jekyll site produces:
 *    - Blog posts: /:year/:month/:day/:slug/ (already tested in Property 3)
 *    - Home page: /index.html
 *    - About page: /about/index.html
 *    - Privacy page: /privacy.html
 *    - Posts list: /posts/index.html
 *    - 404 page: /404.html
 *    - RSS feed: /feed.xml
 *    - Pagination: /posts/page/2/index.html etc. (if enough posts)
 * 3. Verifies each expected URL has a corresponding file in `public/`
 *
 * Feature: jekyll-to-hugo-migration, Property 4: URL Parity Across All Content
 * Validates: Requirements 2.5, 14.1
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

describe('Feature: jekyll-to-hugo-migration, Property 4: URL Parity Across All Content', () => {
  let expectedUrls;
  let publishedPosts;

  /**
   * Replicate Hugo's slug generation from a title string.
   */
  function hugoSlugify(title) {
    return title
      .toLowerCase()
      .replace(/[&:'"!?,;@#$%^*()+=\[\]{}|\\<>\/~`]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Load all non-draft blog posts from content/posts/.
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

        const postDate = new Date(data.date);
        const year = String(postDate.getFullYear());
        const month = String(postDate.getMonth() + 1).padStart(2, '0');
        const day = String(postDate.getDate()).padStart(2, '0');
        const slug = data.slug || hugoSlugify(data.title);

        return { filename, title: data.title, year, month, day, slug };
      })
      .filter(Boolean);
  }

  /**
   * Build the complete list of expected URLs that the Jekyll site produces.
   * Each entry is { url: string, description: string }.
   */
  function buildExpectedUrls(posts) {
    const urls = [];

    // Standalone pages
    urls.push({ url: 'index.html', description: 'Home page' });
    urls.push({ url: 'about/index.html', description: 'About page' });
    urls.push({ url: 'privacy.html', description: 'Privacy page' });
    urls.push({ url: 'posts/index.html', description: 'Posts list page' });
    urls.push({ url: '404.html', description: '404 error page' });
    urls.push({ url: 'feed.xml', description: 'RSS feed' });

    // Blog post URLs: /:year/:month/:day/:slug/index.html
    for (const post of posts) {
      urls.push({
        url: `${post.year}/${post.month}/${post.day}/${post.slug}/index.html`,
        description: `Blog post: ${post.title}`,
      });
    }

    // Pagination pages (5 posts per page, so page count = ceil(posts.length / 5))
    const pagerSize = 5;
    const totalPages = Math.ceil(posts.length / pagerSize);
    if (totalPages > 1) {
      for (let page = 2; page <= totalPages; page++) {
        urls.push({
          url: `posts/page/${page}/index.html`,
          description: `Pagination page ${page}`,
        });
      }
    }

    return urls;
  }

  beforeAll(() => {
    const publicDir = path.resolve('public');
    expect(
      fs.existsSync(publicDir),
      'public/ directory must exist — run Hugo build first: container run --rm --volume="$PWD:/src" hugo-site hugo --minify'
    ).toBe(true);

    publishedPosts = loadPublishedPosts();
    expect(publishedPosts.length).toBeGreaterThan(0);

    expectedUrls = buildExpectedUrls(publishedPosts);
  });

  it('every expected URL from the Jekyll site has a corresponding file in Hugo output (property test, 100+ iterations)', () => {
    /**
     * Validates: Requirements 2.5, 14.1
     *
     * For each randomly selected expected URL, verify that the Hugo build
     * produced a file at the same path under public/.
     */
    const urlIndexArb = fc.integer({ min: 0, max: expectedUrls.length - 1 });

    fc.assert(
      fc.property(urlIndexArb, (index) => {
        const entry = expectedUrls[index];
        const filePath = path.resolve('public', entry.url);

        expect(
          fs.existsSync(filePath),
          `${entry.description} should exist at /${entry.url} but file not found at: ${filePath}`
        ).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('all standalone pages produce files at their expected URLs', () => {
    /**
     * Validates: Requirements 2.5, 14.1
     *
     * Exhaustive check for all standalone (non-blog-post) pages.
     */
    const standaloneUrls = [
      { url: 'index.html', description: 'Home page' },
      { url: 'about/index.html', description: 'About page' },
      { url: 'privacy.html', description: 'Privacy page' },
      { url: 'posts/index.html', description: 'Posts list page' },
      { url: '404.html', description: '404 error page' },
      { url: 'feed.xml', description: 'RSS feed' },
    ];

    for (const entry of standaloneUrls) {
      const filePath = path.resolve('public', entry.url);
      expect(
        fs.existsSync(filePath),
        `${entry.description} should exist at /${entry.url}`
      ).toBe(true);
    }
  });

  it('all blog post URLs have corresponding files in Hugo output', () => {
    /**
     * Validates: Requirements 2.5, 14.1
     *
     * Exhaustive check: every published blog post must have its output
     * at the expected /:year/:month/:day/:slug/index.html path.
     */
    for (const post of publishedPosts) {
      const expectedPath = path.resolve(
        'public', post.year, post.month, post.day, post.slug, 'index.html'
      );
      expect(
        fs.existsSync(expectedPath),
        `Blog post "${post.title}" should have output at /${post.year}/${post.month}/${post.day}/${post.slug}/index.html`
      ).toBe(true);
    }
  });

  it('pagination pages exist when there are enough posts', () => {
    /**
     * Validates: Requirements 2.5, 14.1
     *
     * If there are more than 5 published posts, pagination pages
     * /posts/page/2/index.html, /posts/page/3/index.html, etc. must exist.
     */
    const pagerSize = 5;
    const totalPages = Math.ceil(publishedPosts.length / pagerSize);

    if (totalPages > 1) {
      for (let page = 2; page <= totalPages; page++) {
        const pagePath = path.resolve('public', 'posts', 'page', String(page), 'index.html');
        expect(
          fs.existsSync(pagePath),
          `Pagination page ${page} should exist at /posts/page/${page}/index.html`
        ).toBe(true);
      }
    }
  });
});
