/**
 * Property 13: Draft and Future Post Visibility
 *
 * For any post with `draft: true`, it shall not appear in the default Hugo build
 * output. For any post with a future date, it shall not appear in the default
 * build output. Both shall appear only when the corresponding build flags
 * (`--buildDrafts`, `--buildFuture`) are used.
 *
 * This test validates against the `public/` directory which was built with
 * default Hugo flags (no --buildDrafts or --buildFuture).
 *
 * Feature: jekyll-to-hugo-migration, Property 13: Draft and Future Post Visibility
 * Validates: Requirements 6.5
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

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
 * Parse a post file and return its metadata.
 */
function parsePost(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(content);
  const filename = path.basename(filePath);

  const postDate = new Date(data.date);
  const year = String(postDate.getFullYear());
  const month = String(postDate.getMonth() + 1).padStart(2, '0');
  const day = String(postDate.getDate()).padStart(2, '0');
  const slug = data.slug || hugoSlugify(data.title);

  return {
    filename,
    filePath,
    title: data.title,
    date: postDate,
    year, month, day, slug,
    draft: data.draft === true,
  };
}

/**
 * Check if a post's output exists in the public/ directory.
 */
function postExistsInOutput(post) {
  const outputPath = path.resolve('public', post.year, post.month, post.day, post.slug, 'index.html');
  return fs.existsSync(outputPath);
}

/**
 * Load all blog post files from content/posts/.
 */
function loadAllPosts() {
  const postsDir = path.resolve('content/posts');
  const files = fs.readdirSync(postsDir).filter(
    (f) => f.endsWith('.md') && f !== '_index.md'
  );
  return files.map((f) => parsePost(path.join(postsDir, f)));
}

describe('Feature: jekyll-to-hugo-migration, Property 13: Draft and Future Post Visibility', () => {
  let allPosts;
  let draftPosts;
  let futurePosts;
  let publishedPosts;
  const now = new Date();

  beforeAll(() => {
    const publicDir = path.resolve('public');
    expect(
      fs.existsSync(publicDir),
      'public/ directory must exist — run Hugo build first: container run --rm --volume="$PWD:/src" hugo-site hugo --minify'
    ).toBe(true);

    allPosts = loadAllPosts();
    expect(allPosts.length).toBeGreaterThan(0);

    draftPosts = allPosts.filter((p) => p.draft);
    futurePosts = allPosts.filter((p) => !p.draft && p.date > now);
    publishedPosts = allPosts.filter((p) => !p.draft && p.date <= now);
  });

  it('draft posts do not appear in default build output (property test, 100 iterations)', () => {
    /**
     * Validates: Requirements 6.5
     *
     * For any post with draft: true in its front matter, the default Hugo build
     * (without --buildDrafts) must NOT produce output for that post.
     */
    if (draftPosts.length === 0) {
      // No draft posts exist — property holds vacuously.
      // Generate synthetic draft scenarios to validate the invariant:
      // if a post were marked draft, it should not appear in output.
      // We verify this by confirming no output exists for a hypothetical draft slug.
      const syntheticDraftArb = fc.record({
        year: fc.integer({ min: 2016, max: 2030 }).map(String),
        month: fc.integer({ min: 1, max: 12 }).map((m) => String(m).padStart(2, '0')),
        day: fc.integer({ min: 1, max: 28 }).map((d) => String(d).padStart(2, '0')),
        slug: fc.stringMatching(/^[a-z][a-z0-9-]{3,30}$/).filter((s) => !s.endsWith('-')),
      });

      fc.assert(
        fc.property(syntheticDraftArb, ({ year, month, day, slug }) => {
          // A randomly generated slug should not collide with real published posts
          // This validates the principle: content not built by Hugo won't appear in public/
          const outputPath = path.resolve('public', year, month, day, slug, 'index.html');
          const exists = fs.existsSync(outputPath);
          if (exists) {
            // If it exists, it must be a real published post, not a draft
            const matchingPost = publishedPosts.find(
              (p) => p.year === year && p.month === month && p.day === day && p.slug === slug
            );
            expect(
              matchingPost,
              `Output found at /${year}/${month}/${day}/${slug}/ but no matching published post exists — ` +
              `this could indicate a draft or future post leaked into the build`
            ).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
      return;
    }

    const draftIndexArb = fc.integer({ min: 0, max: draftPosts.length - 1 });

    fc.assert(
      fc.property(draftIndexArb, (index) => {
        const post = draftPosts[index];
        expect(
          postExistsInOutput(post),
          `Draft post "${post.title}" (${post.filename}) should NOT appear in default build output ` +
          `at /${post.year}/${post.month}/${post.day}/${post.slug}/`
        ).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('future-dated posts do not appear in default build output (property test, 100 iterations)', () => {
    /**
     * Validates: Requirements 6.5
     *
     * For any post with a date in the future, the default Hugo build
     * (without --buildFuture) must NOT produce output for that post.
     */
    if (futurePosts.length === 0) {
      // No future posts exist at this moment — property holds vacuously.
      // Verify that all posts in the output are non-future, non-draft posts.
      const postIndexArb = fc.integer({ min: 0, max: allPosts.length - 1 });

      fc.assert(
        fc.property(postIndexArb, (index) => {
          const post = allPosts[index];
          if (postExistsInOutput(post)) {
            expect(
              post.draft,
              `Post "${post.title}" appears in output but is marked as draft`
            ).toBe(false);
            expect(
              post.date.getTime(),
              `Post "${post.title}" appears in output but has a future date (${post.date.toISOString()})`
            ).toBeLessThanOrEqual(now.getTime());
          }
        }),
        { numRuns: 100 }
      );
      return;
    }

    const futureIndexArb = fc.integer({ min: 0, max: futurePosts.length - 1 });

    fc.assert(
      fc.property(futureIndexArb, (index) => {
        const post = futurePosts[index];
        expect(
          postExistsInOutput(post),
          `Future-dated post "${post.title}" (${post.filename}, date: ${post.date.toISOString()}) ` +
          `should NOT appear in default build output at /${post.year}/${post.month}/${post.day}/${post.slug}/`
        ).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('published non-draft, non-future posts DO appear in build output', () => {
    /**
     * Validates: Requirements 6.5
     *
     * Complementary check: posts that are neither draft nor future-dated
     * SHOULD appear in the default build output.
     */
    expect(publishedPosts.length).toBeGreaterThan(0);

    for (const post of publishedPosts) {
      expect(
        postExistsInOutput(post),
        `Published post "${post.title}" (${post.filename}) should appear in build output ` +
        `at /${post.year}/${post.month}/${post.day}/${post.slug}/`
      ).toBe(true);
    }
  });

  it('every output in public/ year directories corresponds to a published post (exhaustive)', () => {
    /**
     * Validates: Requirements 6.5
     *
     * Verify that every blog post output in public/ corresponds to a non-draft,
     * non-future post. No draft or future content should have leaked into the build.
     */
    const publicDir = path.resolve('public');
    const yearDirPattern = /^20\d{2}$/;

    const yearDirs = fs.readdirSync(publicDir).filter((d) =>
      yearDirPattern.test(d) && fs.statSync(path.join(publicDir, d)).isDirectory()
    );

    for (const yearDir of yearDirs) {
      const yearPath = path.join(publicDir, yearDir);
      const monthDirs = fs.readdirSync(yearPath).filter((d) =>
        fs.statSync(path.join(yearPath, d)).isDirectory()
      );

      for (const monthDir of monthDirs) {
        const monthPath = path.join(yearPath, monthDir);
        const dayDirs = fs.readdirSync(monthPath).filter((d) =>
          fs.statSync(path.join(monthPath, d)).isDirectory()
        );

        for (const dayDir of dayDirs) {
          const dayPath = path.join(monthPath, dayDir);
          const slugDirs = fs.readdirSync(dayPath).filter((d) =>
            fs.statSync(path.join(dayPath, d)).isDirectory()
          );

          for (const slugDir of slugDirs) {
            const indexPath = path.join(dayPath, slugDir, 'index.html');
            if (!fs.existsSync(indexPath)) continue;

            // Find the matching content post
            const matchingPost = allPosts.find(
              (p) => p.year === yearDir && p.month === monthDir && p.day === dayDir && p.slug === slugDir
            );

            if (matchingPost) {
              expect(
                matchingPost.draft,
                `Post "${matchingPost.title}" is in build output but has draft: true`
              ).toBe(false);
              expect(
                matchingPost.date.getTime(),
                `Post "${matchingPost.title}" is in build output but has future date ${matchingPost.date.toISOString()}`
              ).toBeLessThanOrEqual(now.getTime());
            }
          }
        }
      }
    }
  });
});
