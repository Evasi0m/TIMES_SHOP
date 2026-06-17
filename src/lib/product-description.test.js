import { describe, expect, it } from 'vitest';
import { normalizeDescription } from './product-description.js';

describe('normalizeDescription', () => {
  it('strips HTML and preserves line breaks', () => {
    const raw = '<p>นาฬิกา CASIO</p><br><ul><li>กันน้ำ</li><li>แบต 10 ปี</li></ul>';
    const out = normalizeDescription(raw);
    expect(out).toContain('นาฬิกา CASIO');
    expect(out).toContain('• กันน้ำ');
    expect(out).not.toContain('<p>');
  });

  it('decodes common HTML entities', () => {
    expect(normalizeDescription('A &amp; B')).toBe('A & B');
  });

  it('returns empty for blank input', () => {
    expect(normalizeDescription('')).toBe('');
    expect(normalizeDescription('   ')).toBe('');
  });

  it('collapses excessive blank lines', () => {
    expect(normalizeDescription('line1\n\n\n\nline2')).toBe('line1\n\nline2');
  });
});
