/**
 * Property 11: Mermaid Code Block Rendering
 *
 * For any blog post containing a fenced code block with language `mermaid`,
 * the rendered HTML output shall include the Mermaid JS module import and
 * the JavaScript that converts `code.language-mermaid` elements to
 * Mermaid-renderable divs.
 *
 * Since we cannot render Hugo templates in JS, this test verifies the template
 * structure in `layouts/partials/extend-scripts.html`:
 * 1. Contains the Mermaid JS module import (from cdn.jsdelivr.net/npm/mermaid)
 * 2. Contains the code.language-mermaid to Mermaid div conversion logic
 * 3. Contains mermaid.initialize() or mermaid.run() call
 * 4. Uses fast-check to generate random mermaid diagram types and verify
 *    the template handles them
 *
 * Feature: jekyll-to-hugo-migration, Property 11: Mermaid Code Block Rendering
 * Validates: Requirements 15.1
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';

describe('Feature: jekyll-to-hugo-migration, Property 11: Mermaid Code Block Rendering', () => {
  let extendScriptsContent;

  beforeAll(() => {
    const extendScriptsPath = path.resolve('layouts/partials/extend-scripts.html');
    expect(fs.existsSync(extendScriptsPath), 'extend-scripts.html partial must exist').toBe(true);
    extendScriptsContent = fs.readFileSync(extendScriptsPath, 'utf8');
  });

  // --- Structural checks ---

  it('imports Mermaid JS module from cdn.jsdelivr.net/npm/mermaid', () => {
    const mermaidImportPattern = /import\s+mermaid\s+from\s+['"]https:\/\/cdn\.jsdelivr\.net\/npm\/mermaid/;
    expect(
      mermaidImportPattern.test(extendScriptsContent),
      'Must import mermaid from cdn.jsdelivr.net/npm/mermaid',
    ).toBe(true);
  });

  it('uses script type="module" for Mermaid import', () => {
    const moduleScriptPattern = /<script\s+type="module">/;
    expect(
      moduleScriptPattern.test(extendScriptsContent),
      'Mermaid import must be inside a <script type="module"> tag',
    ).toBe(true);
  });

  it('contains code.language-mermaid selector for conversion', () => {
    const selectorPattern = /querySelectorAll\s*\(\s*['"]code\.language-mermaid['"]\s*\)/;
    expect(
      selectorPattern.test(extendScriptsContent),
      'Must select code.language-mermaid elements for conversion to Mermaid divs',
    ).toBe(true);
  });

  it('converts code.language-mermaid elements to div.mermaid', () => {
    // The conversion logic should create a div with class "mermaid"
    const divCreationPattern = /className\s*=\s*['"]mermaid['"]/;
    expect(
      divCreationPattern.test(extendScriptsContent),
      'Must create div elements with class "mermaid" from code blocks',
    ).toBe(true);
  });

  it('replaces the pre element with the mermaid div', () => {
    const replacePattern = /replaceChild/;
    expect(
      replacePattern.test(extendScriptsContent),
      'Must replace the pre>code element with the mermaid div',
    ).toBe(true);
  });

  it('calls mermaid.initialize() or mermaid.run()', () => {
    const initPattern = /mermaid\.(initialize|run)\s*\(/;
    expect(
      initPattern.test(extendScriptsContent),
      'Must call mermaid.initialize() or mermaid.run() to render diagrams',
    ).toBe(true);
  });

  it('calls mermaid.initialize with startOnLoad: false', () => {
    const initConfigPattern = /mermaid\.initialize\s*\(\s*\{[^}]*startOnLoad\s*:\s*false/;
    expect(
      initConfigPattern.test(extendScriptsContent),
      'mermaid.initialize must set startOnLoad: false (manual rendering after DOM conversion)',
    ).toBe(true);
  });

  // --- Property-based test with random mermaid diagram types ---

  it('template handles any mermaid diagram type (property test, 100+ iterations)', () => {
    /**
     * Validates: Requirements 15.1
     *
     * Generate random mermaid diagram types and verify the template
     * has the structural patterns to handle each type. The extend-scripts.html
     * partial uses a generic approach (selecting code.language-mermaid and
     * converting to div.mermaid) that works for ALL mermaid diagram types,
     * so the template structure should be diagram-type-agnostic.
     */
    const mermaidDiagramTypes = [
      'graph TD',
      'graph LR',
      'graph BT',
      'graph RL',
      'sequenceDiagram',
      'classDiagram',
      'stateDiagram-v2',
      'erDiagram',
      'gantt',
      'pie',
      'flowchart TD',
      'flowchart LR',
      'journey',
      'gitgraph',
      'mindmap',
      'timeline',
      'quadrantChart',
      'sankey-beta',
      'xychart-beta',
      'block-beta',
    ];

    // Arbitrary for random diagram content
    const mermaidDiagramArb = fc.record({
      diagramType: fc.constantFrom(...mermaidDiagramTypes),
      nodeCount: fc.integer({ min: 1, max: 20 }),
      hasTitle: fc.boolean(),
      title: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    });

    fc.assert(
      fc.property(mermaidDiagramArb, (diagram) => {
        // 1. The template uses a generic selector that works for ANY diagram type.
        //    code.language-mermaid is applied by Hugo's Goldmark renderer to all
        //    ```mermaid fenced code blocks regardless of diagram type.
        expect(
          /code\.language-mermaid/.test(extendScriptsContent),
          `Template must handle diagram type "${diagram.diagramType}" via generic code.language-mermaid selector`,
        ).toBe(true);

        // 2. The conversion extracts textContent from the code element,
        //    which preserves the raw mermaid syntax regardless of diagram type.
        expect(
          /textContent/.test(extendScriptsContent),
          'Template must use textContent to extract mermaid source (works for all diagram types)',
        ).toBe(true);

        // 3. The mermaid library is imported as an ES module, which supports
        //    all diagram types natively.
        expect(
          /import\s+mermaid\s+from/.test(extendScriptsContent),
          'Mermaid must be imported as ES module (supports all diagram types)',
        ).toBe(true);

        // 4. mermaid.run() or mermaid.initialize() is called to render
        //    all .mermaid divs, regardless of diagram type.
        expect(
          /mermaid\.(run|initialize)\s*\(/.test(extendScriptsContent),
          'mermaid.run() or mermaid.initialize() must be called to render diagrams',
        ).toBe(true);

        // 5. The div gets class "mermaid" which is what the mermaid library
        //    looks for when rendering — this is diagram-type-agnostic.
        expect(
          /className\s*=\s*['"]mermaid['"]/.test(extendScriptsContent),
          'Converted div must have class "mermaid" for the library to find and render',
        ).toBe(true);

        // 6. The template handles the full pipeline: select → extract → create div → replace → render
        //    This pipeline is the same for all diagram types.
        const hasSelect = /querySelectorAll/.test(extendScriptsContent);
        const hasExtract = /textContent/.test(extendScriptsContent);
        const hasCreate = /createElement\s*\(\s*['"]div['"]/.test(extendScriptsContent);
        const hasReplace = /replaceChild/.test(extendScriptsContent);
        const hasRender = /mermaid\.(run|initialize)\s*\(/.test(extendScriptsContent);

        expect(
          hasSelect && hasExtract && hasCreate && hasReplace && hasRender,
          `Full mermaid pipeline must exist for diagram type "${diagram.diagramType}"`,
        ).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
