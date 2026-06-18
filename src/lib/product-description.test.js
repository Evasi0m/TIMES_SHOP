import { describe, expect, it } from 'vitest';
import {
  getDescriptionToggleLabel,
  isDescriptionCollapsible,
  isHtmlDescription,
  normalizeDescription,
  PDP_DESCRIPTION_COLLAPSED_MAX_PX,
} from './product-description.js';

describe('description collapse helpers', () => {
  it('uses ~4 line collapsed threshold', () => {
    expect(PDP_DESCRIPTION_COLLAPSED_MAX_PX).toBe(104);
  });

  it('detects collapsible content by height', () => {
    expect(isDescriptionCollapsible(80)).toBe(false);
    expect(isDescriptionCollapsible(104)).toBe(false);
    expect(isDescriptionCollapsible(105)).toBe(false);
    expect(isDescriptionCollapsible(106)).toBe(true);
    expect(isDescriptionCollapsible(400)).toBe(true);
  });

  it('returns Thai toggle labels', () => {
    expect(getDescriptionToggleLabel(false)).toBe('ดูเพิ่มเติม');
    expect(getDescriptionToggleLabel(true)).toBe('ย่อ');
  });
});

describe('isHtmlDescription', () => {
  it('detects image-based HTML descriptions', () => {
    expect(isHtmlDescription('<img src="https://example.com/a.jpg" />')).toBe(true);
    expect(isHtmlDescription('plain text only')).toBe(false);
  });
});

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
