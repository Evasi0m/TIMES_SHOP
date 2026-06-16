import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const MAIN_PATH = path.join(process.cwd(), 'src/main.jsx');

/** Providers referenced in main.jsx must be imported — prevents blank-page ReferenceError. */
describe('main.jsx startup smoke', () => {
  it('imports every JSX provider used in the render tree', () => {
    const src = fs.readFileSync(MAIN_PATH, 'utf8');
    const used = [...src.matchAll(/<([A-Z][A-Za-z0-9]*Provider)\b/g)].map((m) => m[1]);
    const unique = [...new Set(used)];

    expect(unique.length).toBeGreaterThan(0);

    for (const name of unique) {
      const importPattern = new RegExp(
        `import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*['"][^'"]+['"]`
      );
      expect(src, `${name} is used but not imported`).toMatch(importPattern);
    }
  });

  it('does not reference PromoProvider without import (regression)', () => {
    const src = fs.readFileSync(MAIN_PATH, 'utf8');
    if (src.includes('<PromoProvider')) {
      expect(src).toMatch(/import\s*\{\s*PromoProvider\s*\}\s*from\s*['"].+PromoContext/);
    }
  });
});
