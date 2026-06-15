import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { shopApi } from '../lib/shop-api.js';
import { fmtTHB } from '../lib/money.js';
import { CheckIcon } from '../components/icons.jsx';
import { Skeleton } from '../components/Skeleton.jsx';

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const isGuest = !user;
  const passed = location.state?.order;

  const [order, setOrder] = useState(passed || null);
  const [loading, setLoading] = useState(!passed && !isGuest);

  useEffect(() => {
    if (passed || isGuest) return;
    let active = true;
    shopApi.getOrder({ order_id: orderId }).then((res) => {
      if (!active) return;
      if (res.ok) setOrder(res.order);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [orderId, passed, isGuest]);

  const isTransfer = order?.payment_method === 'transfer';

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckIcon size={36} />
      </div>
      <div>
        <h1 className="font-display text-3xl text-ink">สั่งซื้อสำเร็จ</h1>
        <p className="mt-2 text-base text-body">
          {isTransfer
            ? 'อัปโหลดสลิปแล้ว — รอเจ้าหน้าที่ตรวจสอบ'
            : 'รอร้านยืนยันออเดอร์'}
        </p>
        {isGuest && (
          <p className="mt-2 text-sm text-muted">
            สมัครสมาชิกเพื่อดูสถานะออเดอร์และบันทึกที่อยู่
          </p>
        )}
      </div>

      <div className="card-canvas space-y-2 p-4 text-left lg:p-6">
        {loading ? (
          <>
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </>
        ) : order ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted">เลขที่ออเดอร์</span>
              <span className="font-semibold text-ink">{order.web_order_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">สถานะ</span>
              <span className="font-medium text-primary">{order.status_label || 'รอยืนยัน'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">ยอดสุทธิ</span>
              <span className="font-bold text-primary">{fmtTHB(order.grand_total)}</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">
            {isGuest
              ? 'ไม่พบรายละเอียดออเดอร์ — กรุณาเก็บเลขที่ออเดอร์ไว้ หรือสมัครสมาชิกเพื่อติดตามสถานะ'
              : 'ไม่พบรายละเอียดออเดอร์'}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {isGuest ? (
          <>
            <Link to="/auth/register?from=/account/orders" className="btn-primary w-full">
              สมัครสมาชิก
            </Link>
            <Link to="/auth/login?from=/account/orders" className="btn-secondary w-full">
              เข้าสู่ระบบ
            </Link>
          </>
        ) : (
          <Link to="/account/orders" className="btn-secondary w-full">
            ดูประวัติการสั่งซื้อ
          </Link>
        )}
        <Link to="/catalog" className="btn-outline w-full">
          กลับหน้าร้าน
        </Link>
      </div>
    </div>
  );
}
