import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useShipping } from '../context/ShippingContext.jsx';
import { useOrderTotals } from '../context/PromoContext.jsx';
import { PRICE_DISCLAIMER } from '../lib/pricing-policy.js';
import { getSkuDisplayName } from '../lib/product-display.js';
import { fmtTHB } from '../lib/money.js';
import EmptyState from '../components/EmptyState.jsx';
import CartLineItem from '../components/cart/CartLineItem.jsx';
import OrderSummaryCard from '../components/cart/OrderSummaryCard.jsx';
import PromoCodeInput from '../components/cart/PromoCodeInput.jsx';

export default function CartPage() {
  const { items, subtotal, setQuantity, removeItem } = useCart();
  const { shippingFee, shippingLabel } = useShipping();
  const orderTotals = useOrderTotals(subtotal, shippingFee);
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <EmptyState
        title="ยังไม่มีสินค้าในตะกร้า"
        description="เลือกซื้อสินค้าเพื่อเริ่มต้น"
        actionLabel="ไปเลือกสินค้า"
        actionTo="/catalog"
      />
    );
  }

  const itemLines = items.map((i) => ({
    key: i.tiktok_sku_id,
    label: `${getSkuDisplayName(i)} × ${i.quantity}`,
    amount: fmtTHB(i.unit_price * i.quantity),
  }));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-ink lg:text-4xl">
        ตะกร้าสินค้า ({items.length})
      </h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <ul className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <li key={item.tiktok_sku_id}>
              <CartLineItem
                item={item}
                onQuantityChange={setQuantity}
                onRemove={removeItem}
              />
            </li>
          ))}
        </ul>

        <OrderSummaryCard
          subtotal={orderTotals.subtotal}
          shippingFee={orderTotals.shippingFee}
          shippingBase={orderTotals.shippingBase}
          shippingLabel={orderTotals.hasFreeShipping ? 'ส่งฟรี' : shippingLabel}
          promoBreakdown={orderTotals.breakdown.filter((b) => b.promo_type !== 'cod_discount')}
          discount={orderTotals.discount}
          grandTotal={orderTotals.grandTotal}
          itemLines={itemLines}
          submitLabel="ดำเนินการชำระเงิน"
          onSubmit={() => navigate('/checkout')}
          promoCodeSlot={<PromoCodeInput />}
          disclaimer={PRICE_DISCLAIMER}
          extraAction={
            <Link to="/catalog" className="btn-ghost w-full">
              เลือกซื้อสินค้าเพิ่ม
            </Link>
          }
        />
      </div>
    </div>
  );
}
