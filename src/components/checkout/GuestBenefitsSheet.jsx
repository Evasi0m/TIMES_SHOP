import { Link } from 'react-router-dom';
import SlideSheet from '../motion/SlideSheet.jsx';

const DISMISS_KEY = 'times_shop_guest_benefits_dismissed';

export function isGuestBenefitsDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissGuestBenefits() {
  try {
    sessionStorage.setItem(DISMISS_KEY, '1');
  } catch {
    /* ignore */
  }
}

const BENEFITS = [
  'บันทึกที่อยู่จัดส่ง — ไม่ต้องกรอกใหม่ทุกครั้ง',
  'ดูประวัติการสั่งซื้อและติดตามสถานะ',
  'รับสิทธิ์โปรโมชั่นเฉพาะสมาชิก',
  'สั่งซื้อเร็วขึ้นในครั้งถัดไป',
];

export default function GuestBenefitsSheet({ open, onClose }) {
  function handleContinueGuest() {
    dismissGuestBenefits();
    onClose();
  }

  return (
    <SlideSheet
      open={open}
      onClose={handleContinueGuest}
      side="bottom"
      ariaLabelledBy="guest-benefits-title"
      panelClassName="filter-sheet-panel flex max-h-[92vh] w-full max-w-lg flex-col lg:max-h-[85vh]"
      zIndex={70}
    >
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div>
          <h2 id="guest-benefits-title" className="font-display text-xl text-ink">
            สมัครสมาชิก TIMES STORE
          </h2>
          <p className="mt-0.5 text-xs text-muted">สั่งซื้อแบบ guest ได้ แต่สมาชิกจะสะดวกกว่า</p>
        </div>
        <button type="button" onClick={handleContinueGuest} className="icon-btn shrink-0" aria-label="ปิด">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <ul className="space-y-3 text-sm text-body">
          {BENEFITS.map((text) => (
            <li key={text} className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-primary" aria-hidden="true">
                ✓
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2 border-t border-hairline px-4 py-4">
        <Link to="/auth/register?from=/checkout" className="btn-primary w-full min-h-[44px]">
          สมัครสมาชิก
        </Link>
        <Link to="/auth/login?from=/checkout" className="btn-secondary w-full min-h-[44px]">
          เข้าสู่ระบบ
        </Link>
        <button type="button" onClick={handleContinueGuest} className="btn-outline w-full min-h-[44px]">
          สั่งซื้อต่อแบบ guest
        </button>
      </div>
    </SlideSheet>
  );
}
