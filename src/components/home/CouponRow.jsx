import SectionHeader from '../layout/SectionHeader.jsx';
import { useHomeCoupons } from '../../hooks/useHomeCoupons.js';
import HomeCouponTicket from './HomeCouponTicket.jsx';

export default function CouponRow({ block }) {
  const { visiblePromos, loading, collectingId, handleCollect, isCollected } = useHomeCoupons();

  if (loading) {
    return (
      <section className="home-section">
        <SectionHeader title={block?.title || 'คูปองส่วนลด'} />
        <p className="text-sm text-muted">กำลังโหลดคูปอง...</p>
      </section>
    );
  }

  if (!visiblePromos.length) return null;

  return (
    <section className="home-section">
      <SectionHeader title={block?.title || 'คูปองส่วนลด'} action={{ label: 'ดูทั้งหมด', href: '/account/promos' }} />
      <div className="home-coupon-row">
        {visiblePromos.map((promo) => (
          <HomeCouponTicket
            key={promo.id}
            promo={promo}
            collecting={collectingId === promo.id}
            collected={isCollected(promo)}
            onCollect={handleCollect}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        <span className="font-medium text-body">ใช้ได้ทันที</span> = โปรทั้งร้านใช้อัตโนมัติ ·{' '}
        <span className="font-medium text-body">เก็บ</span> = ต้องเข้าสู่ระบบเพื่อรับสิทธิ์
      </p>
    </section>
  );
}
