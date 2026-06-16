import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { shopApi } from '../lib/shop-api.js';
import { fmtTHB } from '../lib/money.js';
import { mapError } from '../lib/error-map.js';
import { useToast } from '../context/ToastContext.jsx';
import OrderTimeline from '../components/order/OrderTimeline.jsx';
import { CheckIcon } from '../components/icons.jsx';
import { Skeleton } from '../components/Skeleton.jsx';

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const isGuest = !user;
  const passed = location.state?.order;

  const [order, setOrder] = useState(passed || null);
  const [loading, setLoading] = useState(!passed && !isGuest);
  const [cancelling, setCancelling] = useState(false);

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

  async function handleCancel() {
    if (!confirm('ยกเลิกออเดอร์นี้?')) return;
    setCancelling(true);
    try {
      const res = await shopApi.cancelOrder({ order_id: orderId });
      if (!res.ok) {
        toast.error(mapError(res));
        return;
      }
      toast.success('ยกเลิกออเดอร์แล้ว');
      setOrder((o) => (o ? { ...o, status: 'voided', status_label: 'ยกเลิก' } : o));
    } finally {
      setCancelling(false);
    }
  }

  const isTransfer = order?.payment_method === 'transfer';
  const canCancel = !isGuest && order?.status === 'pending';

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6 text-center">
      <div className="check-pop mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckIcon size={36} />
      </div>
      <div className="motion-slide-up">
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

      <div className="motion-slide-up card-canvas space-y-4 p-4 text-left lg:p-6" style={{ animationDelay: '80ms' }}>
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
            {order.tracking_no && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">เลขพัสดุ</span>
                <span className="font-medium text-ink">{order.tracking_no}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted">ยอดสุทธิ</span>
              <span className="font-bold text-primary">{fmtTHB(order.grand_total)}</span>
            </div>
            {order.timeline?.length > 0 && (
              <div className="border-t border-hairline pt-4">
                <p className="mb-3 text-sm font-semibold text-ink">สถานะการจัดส่ง</p>
                <OrderTimeline steps={order.timeline} />
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">
            {isGuest
              ? 'ไม่พบรายละเอียดออเดอร์ — กรุณาเก็บเลขที่ออเดอร์ไว้ หรือสมัครสมาชิกเพื่อติดตามสถานะ'
              : 'ไม่พบรายละเอียดออเดอร์'}
          </p>
        )}
      </div>

      <div className="motion-slide-up flex flex-col gap-2" style={{ animationDelay: '120ms' }}>
        {canCancel && (
          <button
            type="button"
            className="btn-danger w-full"
            disabled={cancelling}
            onClick={handleCancel}
          >
            {cancelling ? 'กำลังยกเลิก...' : 'ยกเลิกออเดอร์'}
          </button>
        )}
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
