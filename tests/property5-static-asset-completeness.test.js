/**
 * Property 5: Static Asset Migration Completeness
 *
 * For any file in the original img/, fonts/, or assets/vendor/ directories,
 * a byte-identical copy shall exist in the corresponding static/ subdirectory
 * (static/img/, static/fonts/, static/assets/vendor/).
 *
 * Also verifies:
 *   assets/scripts.js → static/assets/scripts.js
 *   favicon.ico → static/favicon.ico
 *   emergency.txt → static/emergency.txt
 *
 * Feature: jekyll-to-hugo-migration, Property 5: Static Asset Migration Completeness
 * Validates: Requirements 10.1, 10.2, 10.3
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';

/**
 * Recursively find all files in a directory, excluding OS metadata files.
 */
function findAllFiles(dir) {
  const IGNORED = new Set(['.DS_Store', 'Thumbs.db']);
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findAllFiles(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Feature: jekyll-to-hugo-migration, Property 5: Static Asset Migration Completeness', () => {
  /**
   * Source-to-target directory mappings for bulk asset directories.
   */
  const DIRECTORY_MAPPINGS = [
    { source: 'img', target: 'static/img' },
    { source: 'fonts', target: 'static/fonts' },
    { source: 'assets/vendor', target: 'static/assets/vendor' },
  ];

  /**
   * Individual file mappings for standalone assets.
   */
  const FILE_MAPPINGS = [
    { source: 'assets/scripts.js', target: 'static/assets/scripts.js' },
    { source: 'favicon.ico', target: 'static/favicon.ico' },
    { source: 'emergency.txt', target: 'static/emergency.txt' },
  ];

  /** All source files from the bulk directories, with their expected target paths. */
  let directoryAssetFiles = [];

  beforeAll(() => {
    for (const { source, target } of DIRECTORY_MAPPINGS) {
      const sourceDir = path.resolve(source);
      const files = findAllFiles(sourceDir);
      for (const filePath of files) {
        const relativePath = path.relative(sourceDir, filePath);
        directoryAssetFiles.push({
          sourcePath: filePath,
          targetPath: path.resolve(target, relativePath),
          label: `${source}/${relativePath}`,
        });
      }
    }
  });

  it('should find source asset files to test', () => {
    expect(directoryAssetFiles.length).toBeGreaterThan(0);
  });

  it('randomly sampled directory assets have byte-identical copies in static/ (property test, 100 iterations)', () => {
    expect(directoryAssetFiles.length).toBeGreaterThan(0);

    const assetArb = fc.constantFrom(...directoryAssetFiles);

    fc.assert(
      fc.property(assetArb, ({ sourcePath, targetPath, label }) => {
        // Target file must exist
        expect(
          fs.existsSync(targetPath),
          `Missing static copy for "${label}": expected at "${path.relative(process.cwd(), targetPath)}"`
        ).toBe(true);

        // Contents must be byte-identical
        const sourceContent = fs.readFileSync(sourcePath);
        const targetContent = fs.readFileSync(targetPath);
        expect(
          sourceContent.equals(targetContent),
          `File "${label}" is not byte-identical to its static copy`
        ).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('standalone file assets are migrated correctly', () => {
    for (const { source, target } of FILE_MAPPINGS) {
      const sourcePath = path.resolve(source);
      const targetPath = path.resolve(target);

      // Source must exist for the test to be meaningful
      expect(
        fs.existsSync(sourcePath),
        `Source file "${source}" does not exist`
      ).toBe(true);

      // Target must exist
      expect(
        fs.existsSync(targetPath),
        `Missing static copy for "${source}": expected at "${target}"`
      ).toBe(true);

      // Byte-identical
      const sourceContent = fs.readFileSync(sourcePath);
      const targetContent = fs.readFileSync(targetPath);
      expect(
        sourceContent.equals(targetContent),
        `File "${source}" is not byte-identical to its static copy at "${target}"`
      ).toBe(true);
    }
  });

  it('exhaustive check: every directory asset file has a byte-identical static copy', () => {
    for (const { sourcePath, targetPath, label } of directoryAssetFiles) {
      expect(
        fs.existsSync(targetPath),
        `Missing static copy for "${label}": expected at "${path.relative(process.cwd(), targetPath)}"`
      ).toBe(true);

      const sourceContent = fs.readFileSync(sourcePath);
      const targetContent = fs.readFileSync(targetPath);
      expect(
        sourceContent.equals(targetContent),
        `File "${label}" is not byte-identical to its static copy`
      ).toBe(true);
    }
  });
});
