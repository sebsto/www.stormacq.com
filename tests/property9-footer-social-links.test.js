/**
 * Property 9: Footer Social Links Conditional Rendering
 *
 * For any combination of social media usernames (twitter, facebook, github, linkedin)
 * present or absent in the site configuration, the footer partial shall render exactly
 * the corresponding social media icon links — no more, no less.
 *
 * Since we cannot render Hugo templates in JS, this test verifies the template structure:
 * - Each social link is wrapped in a {{ with .Site.Params.<social>_username }} block
 * - Each block contains the correct social media URL pattern and icon class
 * - The template has exactly 4 conditional social link blocks
 *
 * Feature: jekyll-to-hugo-migration, Property 9: Footer Social Links Conditional Rendering
 * Validates: Requirements 5.2
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';

/**
 * Social media link definitions: the expected conditional pattern,
 * URL pattern, and Font Awesome icon class for each social platform.
 */
const SOCIAL_LINKS = [
  {
    name: 'twitter',
    paramKey: 'twitter_username',
    conditionalPattern: /\{\{\s*with\s+\.Site\.Params\.twitter_username\s*\}\}/,
    urlPattern: /https?:\/\/(www\.)?twitter\.com\//,
    iconClass: 'fa-twitter',
  },
  {
    name: 'facebook',
    paramKey: 'facebook_username',
    conditionalPattern: /\{\{\s*with\s+\.Site\.Params\.facebook_username\s*\}\}/,
    urlPattern: /https?:\/\/(www\.)?facebook\.com\//,
    iconClass: 'fa-facebook',
  },
  {
    name: 'github',
    paramKey: 'github_username',
    conditionalPattern: /\{\{\s*with\s+\.Site\.Params\.github_username\s*\}\}/,
    urlPattern: /https?:\/\/(www\.)?github\.com\//,
    iconClass: 'fa-github',
  },
  {
    name: 'linkedin',
    paramKey: 'linkedin_username',
    conditionalPattern: /\{\{\s*with\s+\.Site\.Params\.linkedin_username\s*\}\}/,
    urlPattern: /https?:\/\/(www\.)?linkedin\.com\//,
    iconClass: 'fa-linkedin',
  },
];

describe('Feature: jekyll-to-hugo-migration, Property 9: Footer Social Links Conditional Rendering', () => {
  let footerContent;

  beforeAll(() => {
    const footerPath = path.resolve('themes/clean-blog/layouts/partials/footer.html');
    expect(fs.existsSync(footerPath), 'footer.html partial must exist').toBe(true);
    footerContent = fs.readFileSync(footerPath, 'utf8');
  });

  /**
   * Extract the conditional block for a given social platform.
   * Returns the content between {{ with .Site.Params.<social>_username }} and {{ end }}.
   */
  function extractConditionalBlock(content, paramKey) {
    const blockRegex = new RegExp(
      `\\{\\{\\s*with\\s+\\.Site\\.Params\\.${paramKey}\\s*\\}\\}([\\s\\S]*?)\\{\\{\\s*end\\s*\\}\\}`,
    );
    const match = content.match(blockRegex);
    return match ? match[1] : null;
  }

  it('footer template has exactly 4 conditional social link blocks', () => {
    const withBlocks = footerContent.match(/\{\{\s*with\s+\.Site\.Params\.\w+_username\s*\}\}/g);
    expect(withBlocks, 'Should find conditional social link blocks').not.toBeNull();
    expect(withBlocks.length).toBe(4);
  });

  it('each social platform has correct conditional rendering structure (property test, 100+ iterations)', () => {
    // Arbitrary: generate a random boolean for each social platform (present/absent)
    const socialCombinationArb = fc.record({
      twitter: fc.boolean(),
      facebook: fc.boolean(),
      github: fc.boolean(),
      linkedin: fc.boolean(),
    });

    fc.assert(
      fc.property(socialCombinationArb, (combination) => {
        // For each social platform in the combination, verify the template
        // has the correct conditional block structure
        for (const social of SOCIAL_LINKS) {
          const isPresent = combination[social.name];
          const block = extractConditionalBlock(footerContent, social.paramKey);

          // The conditional block must always exist in the template
          // (it's the {{ with }} that controls rendering at runtime)
          expect(
            block,
            `Footer must have a {{ with .Site.Params.${social.paramKey} }} block for ${social.name}`,
          ).not.toBeNull();

          // When the username IS configured (present=true), the block should
          // contain the correct URL pattern and icon class
          if (isPresent) {
            expect(
              social.urlPattern.test(block),
              `${social.name} block must contain URL pattern: ${social.urlPattern}`,
            ).toBe(true);

            expect(
              block.includes(social.iconClass),
              `${social.name} block must contain icon class: ${social.iconClass}`,
            ).toBe(true);
          }

          // When the username is NOT configured (present=false), the {{ with }}
          // block ensures nothing renders — verify the block does NOT contain
          // any hardcoded/unconditional rendering (the block is self-contained)
          if (!isPresent) {
            // The block content should be entirely within the {{ with }}...{{ end }}
            // wrapper, meaning no content leaks outside. We verify this by checking
            // that the social URL/icon only appears inside the conditional block,
            // not elsewhere in the footer.
            const contentOutsideBlocks = footerContent.replace(
              new RegExp(
                `\\{\\{\\s*with\\s+\\.Site\\.Params\\.${social.paramKey}\\s*\\}\\}[\\s\\S]*?\\{\\{\\s*end\\s*\\}\\}`,
                'g',
              ),
              '',
            );
            expect(
              social.urlPattern.test(contentOutsideBlocks),
              `${social.name} URL should only appear inside its conditional block`,
            ).toBe(false);
            expect(
              contentOutsideBlocks.includes(social.iconClass),
              `${social.name} icon class should only appear inside its conditional block`,
            ).toBe(false);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('each conditional block uses the Hugo context variable (.) for the username value', () => {
    for (const social of SOCIAL_LINKS) {
      const block = extractConditionalBlock(footerContent, social.paramKey);
      expect(block, `Block for ${social.name} must exist`).not.toBeNull();

      // Inside a {{ with }} block, the context (.) is the username value.
      // The URL should reference {{ . }} to insert the username.
      expect(
        /\{\{\s*\.\s*\}\}/.test(block),
        `${social.name} block should use {{ . }} to reference the username value`,
      ).toBe(true);
    }
  });
});
