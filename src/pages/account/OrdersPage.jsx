import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { shopApi } from '../../lib/shop-api.js';
import { fmtTHB, fmtThaiDate } from '../../lib/money.js';
import { getProductDisplayLines, getProductImageAlt } from '../../lib/product-display.js';
import EmptyState from '../../components/EmptyState.jsx';
import ProductImage from '../../components/ProductImage.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    shopApi.getMyOrders({ page: 1, page_size: 20 }).then((res) => {
      if (!active) return;
      if (res.ok) setOrders(res.orders);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Skeleton className="h-24 w-full rounded-card" />
        <Skeleton className="h-24 w-full rounded-card" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="ยังไม่มีคำสั่งซื้อ"
        description="เมื่อคุณสั่งซื้อสินค้า ประวัติจะแสดงที่นี่"
        actionLabel="เลือกซื้อสินค้า"
        actionTo="/catalog"
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl text-ink lg:text-4xl">ประวัติการสั่งซื้อ</h1>
      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.order_id} className="card-canvas space-y-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-ink">{o.web_order_number}</span>
              <StatusBadge status={o.status} label={o.status_label} />
            </div>
            <p className="text-xs text-muted">
              {fmtThaiDate(o.sale_date)} · {o.items.length} รายการ
            </p>
            <ul className="space-y-1 text-sm text-body">
              {o.items.slice(0, 3).map((it, idx) => {
                const { title, subtitle } = getProductDisplayLines(it);
                return (
                <li key={idx} className="flex items-center gap-2">
                  <ProductImage
                    product={it}
                    alt={getProductImageAlt(it)}
                    className="h-8 w-8 shrink-0 overflow-hidden rounded-md"
                    imgClassName="h-full w-full object-cover"
                  />
                  <span className="flex-1 truncate">
                    {title}{subtitle ? ` (${subtitle})` : ''} × {it.quantity}
                  </span>
                </li>
              );})}
            </ul>
            <div className="flex items-center justify-between border-t border-hairline pt-2">
              <span className="text-sm text-muted">
                {o.payment_method === 'cod' ? 'เก็บเงินปลายทาง' : 'โอนเงิน'}
              </span>
              <span className="text-lg font-bold text-primary">{fmtTHB(o.grand_total)}</span>
            </div>
            <Link to={`/order/${o.order_id}`} className="link-btn inline-block">
              ดูรายละเอียด
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
