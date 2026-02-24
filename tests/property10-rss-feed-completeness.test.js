/**
 * Property 10: RSS Feed Content Completeness
 *
 * For any published blog post, the RSS feed at `/feed.xml` shall contain an entry
 * with the post's title, description, date, author, and full content body.
 *
 * This test:
 * 1. Reads the generated `public/feed.xml` (Hugo build must be run beforehand)
 * 2. Parses all <item> entries from the RSS feed
 * 3. Lists all non-draft blog posts from `content/posts/`
 * 4. For each published post, verifies the RSS feed contains an <item> with:
 *    - <title> matching the post title
 *    - <pubDate> present
 *    - <author> present (if post has author)
 *    - <description> containing the full content (not just summary)
 *    - <link> present
 *
 * Feature: jekyll-to-hugo-migration, Property 10: RSS Feed Content Completeness
 * Validates: Requirements 11.2
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

describe('Feature: jekyll-to-hugo-migration, Property 10: RSS Feed Content Completeness', () => {
  let feedXml;
  let feedItems;
  let publishedPosts;

  /**
   * Decode common XML entities back to their character equivalents.
   */
  function decodeXmlEntities(str) {
    if (!str) return str;
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  /**
   * Parse RSS <item> elements from the feed XML using regex.
   * Returns an array of objects with title, link, pubDate, author, description, guid.
   */
  function parseRssItems(xml) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      const getTag = (tag) => {
        const tagMatch = itemXml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
        return tagMatch ? tagMatch[1].trim() : null;
      };
      items.push({
        title: decodeXmlEntities(getTag('title')),
        link: getTag('link'),
        pubDate: getTag('pubDate'),
        author: getTag('author'),
        description: getTag('description'),
        guid: getTag('guid'),
      });
    }
    return items;
  }

  /**
   * Load all non-draft blog posts from content/posts/.
   * Returns an array of { filename, title, date, author, draft } objects.
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
        return {
          filename,
          title: data.title,
          date: data.date,
          author: data.author || null,
          draft: data.draft === true,
          description: data.description || null,
        };
      })
      .filter((post) => !post.draft);
  }

  beforeAll(() => {
    const feedPath = path.resolve('public/feed.xml');
    expect(
      fs.existsSync(feedPath),
      'public/feed.xml must exist — run Hugo build first: container run --rm --volume="$PWD:/src" hugo-site hugo --minify'
    ).toBe(true);

    feedXml = fs.readFileSync(feedPath, 'utf8');
    feedItems = parseRssItems(feedXml);
    publishedPosts = loadPublishedPosts();

    // Sanity check: we should have posts and feed items
    expect(publishedPosts.length).toBeGreaterThan(0);
    expect(feedItems.length).toBeGreaterThan(0);
  });

  it('RSS feed contains an item for every published blog post (property test, 100+ iterations)', () => {
    /**
     * Validates: Requirements 11.2
     *
     * For each randomly selected published post, verify the RSS feed
     * contains a matching <item> with all required fields.
     */
    const postIndexArb = fc.integer({ min: 0, max: publishedPosts.length - 1 });

    fc.assert(
      fc.property(postIndexArb, (index) => {
        const post = publishedPosts[index];

        // Find the matching RSS item by title
        const matchingItem = feedItems.find((item) => item.title === post.title);

        // 1. The post must have a corresponding RSS item
        expect(
          matchingItem,
          `RSS feed must contain an <item> for post "${post.title}" (${post.filename})`
        ).toBeDefined();

        // 2. <link> must be present
        expect(
          matchingItem.link,
          `RSS item for "${post.title}" must have a <link>`
        ).toBeTruthy();

        // 3. <pubDate> must be present
        expect(
          matchingItem.pubDate,
          `RSS item for "${post.title}" must have a <pubDate>`
        ).toBeTruthy();

        // 4. <author> must be present if the post has an author
        if (post.author) {
          expect(
            matchingItem.author,
            `RSS item for "${post.title}" must have an <author> since the post specifies author "${post.author}"`
          ).toBeTruthy();
        }

        // 5. <description> must be present and contain substantial content (full content, not just summary)
        expect(
          matchingItem.description,
          `RSS item for "${post.title}" must have a <description> with content`
        ).toBeTruthy();

        // The description should contain more than just a short summary.
        // Full blog post content should be significantly longer than a typical summary (160 chars).
        expect(
          matchingItem.description.length,
          `RSS item for "${post.title}" description should contain full content, not just a summary (got ${matchingItem.description.length} chars)`
        ).toBeGreaterThan(200);

        // 6. <guid> must be present
        expect(
          matchingItem.guid,
          `RSS item for "${post.title}" must have a <guid>`
        ).toBeTruthy();
      }),
      { numRuns: 100 },
    );
  });

  it('every published post title appears in the RSS feed', () => {
    const feedTitles = feedItems.map((item) => item.title);
    for (const post of publishedPosts) {
      expect(
        feedTitles,
        `RSS feed must include post "${post.title}"`
      ).toContain(post.title);
    }
  });

  it('RSS feed items have valid date format (RFC 2822)', () => {
    /**
     * Validates: Requirements 11.2
     *
     * Each <pubDate> should be a valid RFC 2822 date string.
     */
    for (const item of feedItems) {
      expect(item.pubDate, `Item "${item.title}" must have a pubDate`).toBeTruthy();
      // RFC 2822 date format: "Mon, 02 Jan 2006 15:04:05 -0700"
      const rfc2822Pattern = /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} [+-]\d{4}$/;
      expect(
        rfc2822Pattern.test(item.pubDate),
        `pubDate "${item.pubDate}" for "${item.title}" should match RFC 2822 format`
      ).toBe(true);
    }
  });

  it('RSS feed description contains HTML content (full content, not plain text summary)', () => {
    /**
     * Validates: Requirements 11.2
     *
     * The RSS template uses .Content (full HTML) not .Summary.
     * Verify descriptions contain HTML tags indicating full rendered content.
     */
    for (const item of feedItems) {
      // Full content should contain HTML tags (paragraphs, links, etc.)
      const hasHtmlTags = /&lt;p&gt;|<p>|&lt;a\s|<a\s|&lt;h[1-6]|<h[1-6]|&lt;code|<code|&lt;pre|<pre/.test(
        item.description
      );
      expect(
        hasHtmlTags,
        `RSS item "${item.title}" description should contain HTML content (full post, not plain text summary)`
      ).toBe(true);
    }
  });
});
