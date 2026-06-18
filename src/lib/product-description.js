/** Normalize TikTok product description for PDP display. */

import { formatSpecLineBreaks } from './product-description-format.js';

export { formatSpecLineBreaks, parseDescriptionSpecs, pickSummarySpecs } from './product-description-format.js';

/** ~4 lines at text-sm / leading-relaxed — collapsed PDP description height. */
export const PDP_DESCRIPTION_COLLAPSED_MAX_PX = 104;

export function isDescriptionCollapsible(
  fullHeightPx,
  thresholdPx = PDP_DESCRIPTION_COLLAPSED_MAX_PX,
) {
  return fullHeightPx > thresholdPx + 1;
}

export function getDescriptionToggleLabel(expanded) {
  return expanded ? 'ย่อ' : 'ดูเพิ่มเติม';
}

export function isHtmlDescription(text) {
  return /<img[\s>]/i.test(String(text || ''));
}

export function normalizeDescription(raw) {
  let text = String(raw ?? '').trim();
  if (!text) return '';

  if (isHtmlDescription(text)) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();

  return formatSpecLineBreaks(text);
}
