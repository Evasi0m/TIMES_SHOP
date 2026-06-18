import SlideSheet from '../motion/SlideSheet.jsx';
import HomeCouponTicket from './HomeCouponTicket.jsx';

export default function HomeCouponSheet({
  open,
  onClose,
  promos = [],
  collectingId,
  handleCollect,
  isCollected,
}) {
  return (
    <SlideSheet
      open={open}
      onClose={onClose}
      side="bottom"
      ariaLabelledBy="home-coupon-sheet-title"
      panelClassName="filter-sheet-panel flex max-h-[92vh] w-full max-w-lg flex-col lg:max-h-[85vh]"
      zIndex={70}
    >
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div>
          <h2 id="home-coupon-sheet-title" className="font-display text-xl text-ink">
            คูปองส่วนลด
          </h2>
          <p className="mt-0.5 text-xs text-muted">เก็บคูปองที่ใช้ได้ทั้งหมดจากร้านนี้</p>
        </div>
        <button type="button" onClick={onClose} className="icon-btn shrink-0" aria-label="ปิด">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {promos.map((promo) => (
          <HomeCouponTicket
            key={promo.id}
            promo={promo}
            collecting={collectingId === promo.id}
            collected={isCollected(promo)}
            onCollect={handleCollect}
          />
        ))}
      </div>

      <div className="border-t border-hairline bg-surface-strong/95 px-4 py-3 backdrop-blur">
        <p className="text-xs text-muted">
          <span className="font-medium text-body">ใช้ได้ทันที</span> = โปรทั้งร้านใช้อัตโนมัติ ·{' '}
          <span className="font-medium text-body">เก็บ</span> = ต้องเข้าสู่ระบบเพื่อรับสิทธิ์
        </p>
      </div>
    </SlideSheet>
  );
}
