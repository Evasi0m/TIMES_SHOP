import { describe, expect, it } from 'vitest';
import {
  formatSpecLineBreaks,
  parseDescriptionSpecs,
  pickSummarySpecs,
} from './product-description-format.js';
import { isHtmlDescription, normalizeDescription } from './product-description.js';

const CASIO_GLUE =
  'ขนาดตัวเรือน (ก x ย x ส)34.5 × 26.4 × 8.1 mm น้ำหนัก23 g วัสดุตัวเรือนและกรอบอะลูมิเนียm สายสายเรซิn กันน้ำกันน้ำลึก 50 เมตร';

describe('formatSpecLineBreaks', () => {
  it('splits glued CASIO spec fields', () => {
    const out = formatSpecLineBreaks(CASIO_GLUE);
    expect(out).toContain('ขนาดตัวเรือน (ก x ย x ส)');
    expect(out).toContain('\n34.5');
    expect(out).toContain('\n\nน้ำหนัก');
    expect(out).toContain('\n23 g');
    expect(out).toContain('\n\nกันน้ำ');
  });

  it('does not break short plain text aggressively', () => {
    expect(formatSpecLineBreaks('นาฬิกา CASIO สวย')).toBe('นาฬิกา CASIO สวย');
  });

  it('skips HTML image descriptions in normalizeDescription', () => {
    const html = '<img src="https://example.com/a.jpg" />';
    expect(isHtmlDescription(html)).toBe(true);
    expect(normalizeDescription(html)).toBe(html);
  });
});

describe('parseDescriptionSpecs', () => {
  it('extracts label/value pairs from glued text', () => {
    const specs = parseDescriptionSpecs(CASIO_GLUE);
    expect(specs.length).toBeGreaterThanOrEqual(3);
    expect(specs.find((s) => s.key === 'case_size')?.value).toContain('34.5');
    expect(specs.find((s) => s.key === 'weight')?.value).toContain('23 g');
    expect(specs.find((s) => s.key === 'water_resist')?.value).toContain('50');
  });

  it('pickSummarySpecs prefers highlight keys', () => {
    const specs = parseDescriptionSpecs(CASIO_GLUE);
    const summary = pickSummarySpecs(specs, 4);
    expect(summary.some((s) => s.key === 'case_size')).toBe(true);
    expect(summary.some((s) => s.key === 'weight')).toBe(true);
    expect(summary.length).toBeLessThanOrEqual(4);
  });
});

describe('normalizeDescription with spec formatting', () => {
  it('formats specs after HTML strip', () => {
    const out = normalizeDescription(CASIO_GLUE);
    expect(out).toContain('\n\nน้ำหนัก');
  });
});
