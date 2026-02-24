/**
 * Property 7: Configuration Metadata Completeness
 *
 * Verify that hugo.toml contains all required site metadata fields
 * (title, author, email, description, baseURL, social usernames, Google Analytics ID).
 *
 * Note: Originally this test compared _config.yml to hugo.toml. After Jekyll cleanup
 * (Task 14.1), it validates hugo.toml directly against the known required fields.
 *
 * Feature: jekyll-to-hugo-migration, Property 7: Configuration Metadata Completeness
 * Validates: Requirements 2.1
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import toml from '@iarna/toml';

// Required metadata fields and their expected paths in hugo.toml.
// These are the fields that were originally in _config.yml and must be present in hugo.toml.
const REQUIRED_HUGO_FIELDS = {
  title: { hugoPath: ['title'], type: 'top-level' },
  baseURL: { hugoPath: ['baseURL'], type: 'top-level' },
  author: { hugoPath: ['params', 'author'], type: 'params' },
  email: { hugoPath: ['params', 'email'], type: 'params' },
  description: { hugoPath: ['params', 'description'], type: 'params' },
  twitter_username: { hugoPath: ['params', 'twitter_username'], type: 'params' },
  github_username: { hugoPath: ['params', 'github_username'], type: 'params' },
  linkedin_username: { hugoPath: ['params', 'linkedin_username'], type: 'params' },
  google_analytics: { hugoPath: ['params', 'google_analytics'], type: 'params' },
};

describe('Feature: jekyll-to-hugo-migration, Property 7: Configuration Metadata Completeness', () => {
  let hugoConfig;

  beforeAll(() => {
    const hugoPath = path.resolve('hugo.toml');
    expect(fs.existsSync(hugoPath), 'hugo.toml must exist').toBe(true);
    hugoConfig = toml.parse(fs.readFileSync(hugoPath, 'utf8'));
  });

  /**
   * Helper: resolve a nested path in an object.
   */
  function getNestedValue(obj, pathParts) {
    let current = obj;
    for (const part of pathParts) {
      if (current == null || typeof current !== 'object') return undefined;
      current = current[part];
    }
    return current;
  }

  const fieldNames = Object.keys(REQUIRED_HUGO_FIELDS);

  it('every required metadata field is present in hugo.toml (property test, 100 iterations)', () => {
    const fieldArb = fc.constantFrom(...fieldNames);

    fc.assert(
      fc.property(fieldArb, (fieldName) => {
        const mapping = REQUIRED_HUGO_FIELDS[fieldName];
        const hugoValue = getNestedValue(hugoConfig, mapping.hugoPath);

        expect(hugoValue, `Hugo config missing required field "${fieldName}" at path [${mapping.hugoPath.join('.')}]`).toBeDefined();
        expect(hugoValue, `Hugo config field "${fieldName}" should not be null`).not.toBeNull();
        expect(String(hugoValue).trim().length, `Hugo config field "${fieldName}" should not be empty`).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('all required metadata fields are present (exhaustive check)', () => {
    for (const fieldName of fieldNames) {
      const mapping = REQUIRED_HUGO_FIELDS[fieldName];
      const hugoValue = getNestedValue(hugoConfig, mapping.hugoPath);

      expect(hugoValue, `Hugo config missing required field "${fieldName}" at [${mapping.hugoPath.join('.')}]`).toBeDefined();
      expect(hugoValue, `Hugo config field "${fieldName}" should not be empty`).not.toBeNull();
    }
  });
});
