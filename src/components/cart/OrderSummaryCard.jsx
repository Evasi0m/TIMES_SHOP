import { fmtTHB } from '../../lib/money.js';
import { calcTotalSavings } from '../../lib/pricing-policy.js';
import ShopButton from '../ui/ShopButton.jsx';

export default function OrderSummaryCard({
  subtotal,
  shippingFee = 0,
  shippingLabel,
  shippingBase,
  promoBreakdown = [],
  grandTotal,
  discount,
  itemLines,
  submitLabel,
  onSubmit,
  submitting = false,
  submitType = 'button',
  extraAction,
  promoCodeSlot,
  disclaimer,
  totalHighlight = false,
  className = '',
}) {
  const total = grandTotal ?? subtotal + shippingFee;
  const shippingText = shippingLabel ?? (shippingFee <= 0 ? 'ส่งฟรี' : fmtTHB(shippingFee));
  const showShippingStrike =
    shippingBase != null && shippingBase > shippingFee && shippingFee === 0;
  const savings = calcTotalSavings({ discount: discount ?? promoBreakdown.reduce((s, l) => s + l.amount, 0) });

  return (
    <div className={`card-canvas space-y-3 p-4 lg:p-6 ${className}`.trim()}>
      <h2 className="font-display text-xl text-ink">สรุปคำสั่งซื้อ</h2>

      {itemLines && itemLines.length > 0 && (
        <ul className="space-y-2 text-sm">
          {itemLines.map((line) => (
            <li key={line.key} className="flex justify-between gap-2">
              <span className="text-body">{line.label}</span>
              <span className="font-medium text-ink">{line.amount}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-between text-sm">
        <span className="text-body">ยอดสินค้า</span>
        <span className="font-medium text-ink">{fmtTHB(subtotal)}</span>
      </div>

      {promoBreakdown.map((line) => (
        <div
          key={`${line.id}-${line.promo_type}`}
          className="promo-flash flex justify-between text-sm"
        >
          <span className="text-body">{line.display_name}</span>
          <span className="font-medium text-success">-{fmtTHB(line.amount)}</span>
        </div>
      ))}

      <div className="flex justify-between text-sm">
        <span className="text-body">ค่าจัดส่ง</span>
        <span className={`font-medium ${shippingFee <= 0 ? 'text-primary' : 'text-ink'}`}>
          {showShippingStrike && (
            <span className="mr-2 text-muted line-through">{fmtTHB(shippingBase)}</span>
          )}
          {shippingText}
        </span>
      </div>

      {promoCodeSlot}

      {savings > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-body">ประหยัดไป</span>
          <span className="font-medium text-success">{fmtTHB(savings)}</span>
        </div>
      )}

      <div className={`flex justify-between border-t border-hairline pt-3 ${totalHighlight ? 'promo-flash rounded-lg bg-canvas px-2 py-2' : ''}`}>
        <span className="font-semibold text-ink">รวมทั้งสิ้น</span>
        <span className="text-lg font-bold text-primary">{fmtTHB(total)}</span>
      </div>

      {disclaimer && <p className="text-xs text-muted">{disclaimer}</p>}

      {submitLabel && (
        <ShopButton
          type={submitType}
          variant="primary"
          className="w-full opacity-100 disabled:pointer-events-none disabled:opacity-80"
          loading={submitting}
          loadingLabel="กำลังดำเนินการ..."
          onClick={submitType === 'button' ? onSubmit : undefined}
        >
          {submitLabel}
        </ShopButton>
      )}

      {extraAction}
    </div>
  );
}
