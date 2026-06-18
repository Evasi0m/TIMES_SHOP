import { Link } from 'react-router-dom';
import SlideSheet from '../motion/SlideSheet.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useOrderTotals } from '../../context/PromoContext.jsx';
import { useShipping } from '../../context/ShippingContext.jsx';
import { PRICE_DISCLAIMER } from '../../lib/pricing-policy.js';
import { fmtTHB } from '../../lib/money.js';
import { getSkuDisplayName } from '../../lib/product-display.js';

export default function MiniCartDrawer({ open, onClose }) {
  const { items, subtotal, setQuantity, removeItem } = useCart();
  const { shippingFee } = useShipping();
  const orderTotals = useOrderTotals(subtotal, shippingFee);

  const promoLines = orderTotals.breakdown.filter(
    (b) => b.promo_type !== 'cod_discount'
  );

  return (
    <SlideSheet open={open} onClose={onClose} side="right" ariaLabel="ตะกร้าสินค้า" zIndex={50}>
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <h2 className="font-display text-lg text-ink">ตะกร้า ({items.length})</h2>
        <button type="button" className="icon-btn text-muted" onClick={onClose} aria-label="ปิด">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <p className="motion-slide-up py-8 text-center text-muted">ยังไม่มีสินค้าในตะกร้า</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.tiktok_sku_id} className="flex gap-3 border-b border-hairline pb-3">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-ink">
                    {getSkuDisplayName(item)}
                  </p>
                  <p className="text-sm text-muted">
                    {fmtTHB(item.unit_price)} × {item.quantity}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="icon-btn text-muted"
                      onClick={() => setQuantity(item.tiktok_sku_id, item.quantity - 1)}
                      aria-label="ลดจำนวน"
                    >
                      −
                    </button>
                    <span className="text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      className="icon-btn text-muted"
                      onClick={() => setQuantity(item.tiktok_sku_id, item.quantity + 1)}
                      aria-label="เพิ่มจำนวน"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="ml-auto text-xs text-error"
                      onClick={() => removeItem(item.tiktok_sku_id)}
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t border-hairline space-y-2 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted">ยอดสินค้า</span>
            <span className="text-ink">{fmtTHB(orderTotals.subtotal)}</span>
          </div>
          {promoLines.map((line) => (
            <div key={`${line.id}-${line.promo_type}`} className="flex justify-between text-sm">
              <span className="text-body">{line.display_name}</span>
              <span className="text-success">-{fmtTHB(line.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm">
            <span className="text-muted">ค่าจัดส่ง</span>
            <span className={orderTotals.shippingFee <= 0 ? 'text-primary' : 'text-ink'}>
              {orderTotals.shippingFee <= 0 ? 'ส่งฟรี' : fmtTHB(orderTotals.shippingFee)}
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span className="text-ink">รวมทั้งสิ้น</span>
            <span className="text-primary">{fmtTHB(orderTotals.grandTotal)}</span>
          </div>
          <p className="text-xs text-muted">{PRICE_DISCLAIMER}</p>
          <Link to="/checkout" className="btn-primary block w-full text-center" onClick={onClose}>
            ชำระเงิน
          </Link>
          <Link to="/cart" className="btn-ghost block w-full text-center" onClick={onClose}>
            ดูตะกร้าเต็ม
          </Link>
        </div>
      )}
    </SlideSheet>
  );
}
