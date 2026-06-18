import { Link } from 'react-router-dom';
import AdminFormSection from '../AdminFormSection.jsx';
import {
  DISCOUNT_MODES,
  PROMO_TYPE_DESCRIPTIONS,
  PROMO_TYPE_LABELS,
  PROMO_TYPE_LIST,
  PROMO_TYPES,
} from '../../../lib/promo-types.js';

export default function PromoEditorForm({ form, update, onSubmit, saving, footerClassName = '' }) {
  const isFreeShipping = form.promo_type === PROMO_TYPES.FREE_SHIPPING;

  return (
    <form onSubmit={onSubmit} className="admin-card admin-card--pad promo-editor__form">
      <AdminFormSection
        title="ข้อมูลพื้นฐาน"
        description="ชื่อที่ลูกค้าเห็นและประเภทโปร"
      >
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-body-strong">
            ชื่อที่ลูกค้าเห็น *
          </label>
          <input
            value={form.display_name}
            onChange={(e) => update('display_name', e.target.value)}
            className="input"
            placeholder="เช่น ลด 10% สินค้า"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-body-strong">ประเภทโปร *</label>
          <select
            value={form.promo_type}
            onChange={(e) => update('promo_type', e.target.value)}
            className="input"
          >
            {PROMO_TYPE_LIST.map((type) => (
              <option key={type} value={type}>
                {PROMO_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted">{PROMO_TYPE_DESCRIPTIONS[form.promo_type]}</p>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="โค้ดสำหรับลูกค้ากรอก"
        description="เปิดใช้เมื่อต้องการให้ลูกค้ากรอกโค้ดตอน checkout"
      >
        <label className="flex min-h-[44px] items-center gap-2 text-sm text-body">
          <input
            type="checkbox"
            checked={form.code_entry_enabled}
            onChange={(e) => update('code_entry_enabled', e.target.checked)}
          />
          ให้ลูกค้ากรอกโค้ดได้
        </label>
        {form.code_entry_enabled && (
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-body-strong">
              โค้ดสาธารณะ (public code)
            </label>
            <input
              value={form.public_code || ''}
              onChange={(e) => update('public_code', e.target.value.toUpperCase())}
              className="input uppercase"
              placeholder="เช่น SUMMER10"
            />
          </div>
        )}
      </AdminFormSection>

      {!isFreeShipping && (
        <AdminFormSection
          title="เงื่อนไขส่วนลด"
          description="รูปแบบและมูลค่าส่วนลด รวมถึงยอดสั่งซื้อขั้นต่ำ"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-body-strong">
                รูปแบบส่วนลด
              </label>
              <select
                value={form.discount_mode}
                onChange={(e) => update('discount_mode', e.target.value)}
                className="input"
              >
                <option value={DISCOUNT_MODES.PERCENT}>เปอร์เซ็นต์ (%)</option>
                <option value={DISCOUNT_MODES.AMOUNT}>จำนวนเงิน (บาท)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-body-strong">มูลค่าส่วนลด</label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.discount_value}
                onChange={(e) => update('discount_value', e.target.value)}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-body-strong">
              ยอดสั่งซื้อขั้นต่ำ (บาท)
            </label>
            <input
              type="number"
              min="0"
              value={form.min_order}
              onChange={(e) => update('min_order', e.target.value)}
              className="input"
            />
          </div>
        </AdminFormSection>
      )}

      <AdminFormSection
        title="ระยะเวลาและข้อจำกัด"
        description="กำหนดช่วงใช้งานและจำนวนครั้งที่ใช้ได้"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-body-strong">เริ่มใช้</label>
            <input
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => update('starts_at', e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-body-strong">หมดอายุ</label>
            <input
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) => update('expires_at', e.target.value)}
              className="input"
              disabled={form.no_expiry}
            />
            <label className="mt-2 flex min-h-[44px] items-center gap-2 text-sm text-body">
              <input
                type="checkbox"
                checked={form.no_expiry}
                onChange={(e) => update('no_expiry', e.target.checked)}
              />
              ไม่มีวันหมดอายุ
            </label>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-body-strong">
            จำกัดจำนวนครั้ง (ว่าง = ไม่จำกัด)
          </label>
          <input
            type="number"
            min="1"
            value={form.max_uses}
            onChange={(e) => update('max_uses', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-body-strong">
            จำกัดต่อลูกค้า (ว่าง = ไม่จำกัด)
          </label>
          <input
            type="number"
            min="1"
            value={form.max_uses_per_user ?? ''}
            onChange={(e) => update('max_uses_per_user', e.target.value)}
            className="input"
            placeholder="เช่น 1"
          />
          <p className="mt-1 text-xs text-muted">นับเฉพาะลูกค้าที่เข้าสู่ระบบ — แขกไม่ถูกจำกัด</p>
        </div>
      </AdminFormSection>

      <div className={`promo-editor-footer promo-editor-footer--sticky ${footerClassName}`.trim()}>
        <Link to="/admin/promos" className="btn-admin-secondary min-h-[44px] flex-1 text-center">
          ยกเลิก
        </Link>
        <button type="submit" disabled={saving} className="btn-admin-primary min-h-[44px] flex-1">
          {saving ? 'กำลังบันทึก...' : 'บันทึกแบบร่าง'}
        </button>
      </div>
    </form>
  );
}
