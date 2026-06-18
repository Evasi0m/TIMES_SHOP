import { formToPreviewPromo } from '../../../lib/promo-vault.js';
import {
  formatCouponTicketSubtitle,
  formatPromoDiscount,
} from '../../../lib/promo-display.js';
import { PROMO_TYPE_LABELS } from '../../../lib/promo-types.js';
import { fmtTHB } from '../../../lib/money.js';

function formatMinOrder(n) {
  const v = Number(n) || 0;
  return v > 0 ? fmtTHB(v) : 'ไม่มี';
}

function formatExpiry(form) {
  if (form.no_expiry) return 'ไม่หมดอายุ';
  if (!form.expires_at) return '—';
  return new Date(form.expires_at).toLocaleDateString('th-TH');
}

export default function PromoEditorPreview({ form }) {
  const previewPromo = formToPreviewPromo(form);
  const value = formatPromoDiscount(previewPromo);
  const subtitle = formatCouponTicketSubtitle(previewPromo, value);

  return (
    <div className="promo-editor-preview-card">
      <p className="promo-editor-preview-card__label">ตัวอย่างที่ลูกค้าเห็น</p>
      <div className="promo-vault-chip-preview glass-surface-sm mb-4">
        <span className="promo-vault-chip-preview__value">{value}</span>
        {subtitle ? <span className="promo-vault-chip-preview__sub">{subtitle}</span> : null}
      </div>
      <ul className="promo-editor-summary">
        <li>
          <span>ชื่อ</span>
          <strong>{form.display_name?.trim() || '—'}</strong>
        </li>
        <li>
          <span>ประเภท</span>
          <strong>{PROMO_TYPE_LABELS[form.promo_type] || '—'}</strong>
        </li>
        <li>
          <span>ขั้นต่ำ</span>
          <strong>{formatMinOrder(form.min_order)}</strong>
        </li>
        <li>
          <span>หมดอายุ</span>
          <strong>{formatExpiry(form)}</strong>
        </li>
        {form.code_entry_enabled && (
          <li>
            <span>โค้ด</span>
            <strong>{form.public_code?.trim() || '—'}</strong>
          </li>
        )}
      </ul>
    </div>
  );
}
