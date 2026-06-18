import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { shopApi } from '../lib/shop-api.js';
import { fmtTHB } from '../lib/money.js';
import { mapError } from '../lib/error-map.js';
import OrderTimeline from '../components/order/OrderTimeline.jsx';
import BannerAlert from '../components/ui/BannerAlert.jsx';
import { Skeleton } from '../components/Skeleton.jsx';

export default function GuestOrderTrackPage() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [webOrderNumber, setWebOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenFromUrl));
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!tokenFromUrl) return;
    let active = true;
    setLoading(true);
    setError(null);
    shopApi.guestOrderTrack({ token: tokenFromUrl }).then((res) => {
      if (!active) return;
      if (res.ok) {
        setOrder(res.order);
        setSearched(true);
      } else {
        setError(mapError(res));
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [tokenFromUrl]);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);
    setSearched(true);
    try {
      const res = await shopApi.guestOrderTrack({
        web_order_number: webOrderNumber.trim(),
        phone: phone.trim(),
      });
      if (!res.ok) {
        setError(mapError(res));
        return;
      }
      setOrder(res.order);
    } catch (err) {
      setError(mapError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <div>
        <h1 className="font-display text-3xl text-ink">ติดตามออเดอร์</h1>
        <p className="mt-2 text-sm text-body">
          สำหรับลูกค้าที่สั่งซื้อแบบไม่สมัครสมาชิก
        </p>
      </div>

      {!tokenFromUrl && (
        <form onSubmit={handleSearch} className="card-canvas space-y-3 p-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-body-strong">
              เลขที่ออเดอร์
            </label>
            <input
              className="input"
              value={webOrderNumber}
              onChange={(e) => setWebOrderNumber(e.target.value)}
              placeholder="เช่น WEB-20260618-0001"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-body-strong">
              เบอร์โทร 4 หลักท้าย
            </label>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(-4))}
              placeholder="เช่น 1234"
              inputMode="numeric"
              maxLength={4}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'กำลังค้นหา...' : 'ค้นหาออเดอร์'}
          </button>
        </form>
      )}

      {error && <BannerAlert variant="error">{error}</BannerAlert>}

      {loading && (
        <div className="card-canvas space-y-3 p-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}

      {!loading && order && (
        <div className="card-canvas space-y-4 p-4">
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
        </div>
      )}

      {!loading && searched && !order && !error && (
        <p className="text-center text-sm text-muted">ไม่พบออเดอร์</p>
      )}

      <Link to="/catalog" className="btn-outline block w-full text-center">
        กลับหน้าร้าน
      </Link>
    </div>
  );
}
