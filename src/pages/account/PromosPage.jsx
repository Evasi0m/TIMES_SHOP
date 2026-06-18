import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { shopApi } from '../../lib/shop-api.js';
import { formatPromoDiscount, formatPromoPeriod } from '../../lib/promo-display.js';
import { fmtTHB } from '../../lib/money.js';
import { PROMO_TYPE_LABELS } from '../../lib/promo-types.js';

function promoUsageHint(promo) {
  if (promo.distribution === 'broadcast') {
    const minOrder = Number(promo.min_order) || 0;
    if (minOrder > 0) {
      return { status: 'min_order', text: `ใช้ได้เมื่อยอดถึง ${fmtTHB(minOrder)}` };
    }
    return { status: 'auto', text: 'ใช้อัตโนมัติแล้ว' };
  }
  const minOrder = Number(promo.min_order) || 0;
  if (minOrder > 0) {
    return { status: 'min_order', text: `ใช้ได้เมื่อยอดถึง ${fmtTHB(minOrder)}` };
  }
  return { status: 'auto', text: 'ใช้อัตโนมัติแล้ว' };
}

export default function PromosPage() {
  const { user } = useAuth();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    shopApi.getMyPromos({ user_id: user.id }).then((res) => {
      if (res.ok) setPromos(res.promos || []);
      setLoading(false);
    });
  }, [user?.id]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/account" className="text-sm text-muted transition hover:text-primary">
          ← กลับบัญชี
        </Link>
        <h1 className="mt-2 font-display text-3xl text-ink lg:text-4xl">สิทธิ์ส่วนลดของฉัน</h1>
        <p className="mt-2 text-sm text-body">
          โปรที่ร้านแจกให้คุณ — ใช้งานอัตโนมัติ ไม่ต้องกรอก code
        </p>
      </div>

      {loading ? (
        <p className="text-muted">กำลังโหลด...</p>
      ) : promos.length === 0 ? (
        <div className="card-canvas p-6 text-center text-body">
          ยังไม่มีโปรเฉพาะบัญชี — โปรทั้งร้านจะใช้ได้อัตโนมัติเมื่อร้านเปิดใช้งาน
        </div>
      ) : (
        <ul className="space-y-3">
          {promos.map((promo) => {
            const hint = promoUsageHint(promo);
            return (
            <li key={promo.id} className="card-canvas p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span
                    className={`text-xs font-medium ${
                      promo.status === 'active' ? 'text-success' : 'text-muted'
                    }`}
                  >
                    {promo.status === 'active' ? 'ใช้งานได้' : 'หมดอายุ'}
                  </span>
                  <h2 className="mt-1 font-display text-lg text-ink">{promo.display_name}</h2>
                  <p className="text-sm font-semibold text-primary">{formatPromoDiscount(promo)}</p>
                  <p className="mt-1 text-xs text-primary">{hint.text}</p>
                  <p className="mt-1 text-xs text-muted">{PROMO_TYPE_LABELS[promo.promo_type]}</p>
                  {(promo.public_code || promo.internal_code) && (
                    <div className="mt-2 flex items-center gap-2">
                      <code className="rounded bg-canvas px-2 py-1 text-xs font-mono text-ink">
                        {promo.public_code || promo.internal_code}
                      </code>
                      <button
                        type="button"
                        className="text-xs text-primary underline"
                        onClick={() => navigator.clipboard?.writeText(promo.public_code || promo.internal_code)}
                      >
                        คัดลอก
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-muted">{formatPromoPeriod(promo)}</p>
              {hint.status === 'min_order' && promo.status === 'active' && (
                <Link to="/cart" className="mt-2 inline-block text-sm text-primary underline">
                  ไปที่ตะกร้า
                </Link>
              )}
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
