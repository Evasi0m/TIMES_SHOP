import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useShipping } from '../context/ShippingContext.jsx';
import { useOrderTotals } from '../context/PromoContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { shopApi } from '../lib/shop-api.js';
import { fmtTHB } from '../lib/money.js';
import { getSkuDisplayName } from '../lib/product-display.js';
import { mapError } from '../lib/error-map.js';
import EmptyState from '../components/EmptyState.jsx';
import BannerAlert from '../components/ui/BannerAlert.jsx';
import OrderSummaryCard from '../components/cart/OrderSummaryCard.jsx';
import GuestBenefitsSheet, { isGuestBenefitsDismissed } from '../components/checkout/GuestBenefitsSheet.jsx';

const EMPTY_FORM = {
  recipient_name: '',
  phone: '',
  address_line: '',
  subdistrict: '',
  district: '',
  province: '',
  postal_code: '',
  notes: '',
};

const SLIP_MAX_BYTES = 5 * 1024 * 1024;
const SLIP_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export default function CheckoutPage() {
  const { items, subtotal, applyValidatedItems, clearCart } = useCart();
  const { user } = useAuth();
  const isGuest = !user;
  const { shippingFee, shippingLabel } = useShipping();
  const [paymentMethod, setPaymentMethod] = useState('');
  const orderTotals = useOrderTotals(subtotal, shippingFee, paymentMethod);
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [saveAddress, setSaveAddress] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);

  const [slipFile, setSlipFile] = useState(null);
  const [slipPath, setSlipPath] = useState(null);
  const [slipStatus, setSlipStatus] = useState(null);

  const [validationIssues, setValidationIssues] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [guestBenefitsOpen, setGuestBenefitsOpen] = useState(false);

  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const orderTotal = orderTotals.grandTotal;

  useEffect(() => {
    if (isGuest && !isGuestBenefitsDismissed()) {
      setGuestBenefitsOpen(true);
    }
  }, [isGuest]);

  useEffect(() => {
    shopApi.getPaymentInfo().then((res) => {
      if (res.ok) setPaymentInfo(res);
    });
  }, []);

  useEffect(() => {
    if (isGuest) return;
    shopApi.listAddresses().then((res) => {
      if (res.ok) {
        setAddresses(res.addresses);
        const def = res.addresses.find((a) => a.is_default);
        if (def) applyAddress(def);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest]);

  function applyAddress(addr) {
    setSelectedAddressId(addr.id);
    setForm({
      recipient_name: addr.recipient_name || '',
      phone: addr.phone || '',
      address_line: addr.address_line || '',
      subdistrict: addr.subdistrict || '',
      district: addr.district || '',
      province: addr.province || '',
      postal_code: addr.postal_code || '',
      notes: '',
    });
    setSaveAddress(false);
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSelectedAddressId('');
  }

  async function handleSlipChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!SLIP_TYPES.includes(file.type)) {
      toast.error('รองรับเฉพาะไฟล์ JPG / PNG / PDF');
      return;
    }
    if (file.size > SLIP_MAX_BYTES) {
      toast.error('ไฟล์ต้องไม่เกิน 5MB');
      return;
    }
    setSlipFile(file);
    setSlipStatus(null);
    setSlipPath(null);
    try {
      const up = await shopApi.uploadSlip(file, { user_id: user?.id });
      if (!up.ok) throw new Error(up.error);
      const verify = await shopApi.verifySlip({
        storage_path: up.storage_path,
        expected_amount: orderTotal,
      });
      if (!verify.ok) throw new Error(verify.error);
      setSlipPath(up.storage_path);
      setSlipStatus(verify.status); // pending_review
      toast.success(verify.message || 'อัปโหลดสลิปสำเร็จ');
    } catch (err) {
      setSlipFile(null);
      toast.error(mapError(err));
    }
  }

  function validateForm() {
    const required = ['recipient_name', 'phone', 'address_line', 'province', 'postal_code'];
    for (const f of required) {
      if (!form[f].trim()) return false;
    }
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('กรุณากรอกข้อมูลจัดส่งให้ครบถ้วน');
      return;
    }
    if (!paymentMethod) {
      toast.error('กรุณาเลือกวิธีชำระเงิน');
      return;
    }
    if (paymentMethod === 'transfer' && !slipPath) {
      toast.error('กรุณาแนบสลิปการโอนเงิน');
      return;
    }

    setSubmitting(true);
    setValidationIssues(null);
    try {
      // Always re-validate server-side before placing the order.
      const validation = await shopApi.validateCart({
        items: items.map((i) => ({
          tiktok_sku_id: i.tiktok_sku_id,
          quantity: i.quantity,
          expected_unit_price: i.unit_price,
        })),
        payment_method: paymentMethod,
        user_id: user?.id,
      });

      if (!validation.ok) {
        toast.error(mapError(validation));
        return;
      }

      if (!validation.valid) {
        applyValidatedItems(validation.items);
        setValidationIssues(validation);
        toast.error('ราคา/สต็อกมีการเปลี่ยนแปลง กรุณาตรวจสอบก่อนยืนยัน');
        return;
      }

      const res = await shopApi.placeOrder({
        items: validation.items.map((i) => ({
          tiktok_sku_id: i.tiktok_sku_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        shipping: form,
        save_address: isGuest ? false : saveAddress,
        address_id: selectedAddressId || null,
        payment_method: paymentMethod,
        applied_promo_ids: validation.applied_promo_ids || orderTotals.appliedPromoIds,
        user_id: user?.id,
        slip_storage_path: slipPath,
        idempotency_key: idempotencyKey,
      });

      if (!res.ok) {
        toast.error(mapError(res));
        return;
      }

      if (!isGuest && saveAddress && !selectedAddressId) {
        await shopApi.upsertAddress({ id: null, label: 'ที่อยู่จัดส่ง', ...form });
      }

      clearCart();
      navigate(`/order/${res.order_id}`, {
        replace: true,
        state: { order: res },
      });
    } catch (err) {
      toast.error(mapError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="ไม่มีสินค้าสำหรับชำระเงิน"
        description="กรุณาเพิ่มสินค้าลงตะกร้าก่อน"
        actionLabel="เลือกซื้อสินค้า"
        actionTo="/catalog"
      />
    );
  }

  const banks = paymentInfo?.bank_accounts ?? [];

  return (
    <>
      <GuestBenefitsSheet open={guestBenefitsOpen} onClose={() => setGuestBenefitsOpen(false)} />
      <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="font-display text-3xl text-ink lg:text-4xl">ชำระเงิน</h1>

      {isGuest && (
        <BannerAlert variant="info">
          สั่งซื้อแบบไม่สมัครสมาชิกได้ แต่จะไม่บันทึกที่อยู่ไว้ใช้ครั้งถัดไป
        </BannerAlert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {!isGuest && addresses.length > 0 && (
            <section className="card-canvas p-4 lg:p-6">
              <h2 className="mb-3 font-display text-xl text-ink">เลือกที่อยู่ที่บันทึกไว้</h2>
              <div className="space-y-2">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition ${
                      selectedAddressId === a.id
                        ? 'border-primary ring-2 ring-primary'
                        : 'border-hairline'
                    }`}
                  >
                    <input
                      type="radio"
                      name="savedAddress"
                      checked={selectedAddressId === a.id}
                      onChange={() => applyAddress(a)}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-medium text-ink">
                        {a.recipient_name} · {a.phone}
                      </span>
                      <br />
                      <span className="text-muted">
                        {[a.address_line, a.subdistrict, a.district, a.province, a.postal_code]
                          .filter(Boolean)
                          .join(' ')}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          <section className="card-canvas space-y-3 p-4 lg:p-6">
            <h2 className="font-display text-xl text-ink">ข้อมูลจัดส่ง</h2>
            <Field label="ชื่อผู้รับ *" value={form.recipient_name} onChange={(v) => update('recipient_name', v)} />
            <Field label="เบอร์โทร *" value={form.phone} onChange={(v) => update('phone', v)} type="tel" />
            <Field label="ที่อยู่ (บ้านเลขที่ ถนน) *" value={form.address_line} onChange={(v) => update('address_line', v)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="แขวง/ตำบล" value={form.subdistrict} onChange={(v) => update('subdistrict', v)} />
              <Field label="เขต/อำเภอ" value={form.district} onChange={(v) => update('district', v)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="จังหวัด *" value={form.province} onChange={(v) => update('province', v)} />
              <Field label="รหัสไปรษณีย์ *" value={form.postal_code} onChange={(v) => update('postal_code', v)} type="tel" />
            </div>
            <Field label="หมายเหตุการจัดส่ง" value={form.notes} onChange={(v) => update('notes', v)} />
            {!isGuest && (
              <label className="flex items-center gap-2 text-sm text-body">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                บันทึกที่อยู่นี้ไว้ใช้ครั้งต่อไป
              </label>
            )}
          </section>

          <section className="card-canvas space-y-3 p-4 lg:p-6">
            <h2 className="font-display text-xl text-ink">วิธีชำระเงิน</h2>
            <PaymentOption
              checked={paymentMethod === 'cod'}
              onSelect={() => setPaymentMethod('cod')}
              title="เก็บเงินปลายทาง (COD)"
              desc="ชำระเงินสดกับพนักงานจัดส่ง"
            />
            <PaymentOption
              checked={paymentMethod === 'transfer'}
              onSelect={() => setPaymentMethod('transfer')}
              title="โอนเงินผ่านบัญชีธนาคาร"
              desc="โอนแล้วแนบสลิปเพื่อให้เจ้าหน้าที่ตรวจสอบ"
            />

            {paymentMethod === 'transfer' && (
              <div className="card-cream space-y-3 p-4">
                {banks.length === 0 ? (
                  <p className="text-sm text-muted">
                    ร้านกำลังตั้งค่าบัญชีธนาคาร กรุณาเลือกเก็บเงินปลายทาง หรือติดต่อร้าน
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-ink">โอนเงินมาที่บัญชี</p>
                    {banks.map((b) => (
                      <div key={b.id} className="card-cream p-4 text-sm">
                        <p className="font-medium text-ink">{b.bank_name}</p>
                        <p className="text-body">เลขบัญชี: {b.account_number}</p>
                        <p className="text-muted">ชื่อบัญชี: {b.account_name}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label htmlFor="slip" className="mb-2 block text-sm font-semibold text-body-strong">
                    แนบสลิปการโอนเงิน *
                  </label>
                  <label htmlFor="slip" className="file-upload-slip">
                    <span className="text-2xl" aria-hidden="true">📄</span>
                    <span className="text-sm font-medium text-ink">
                      {slipFile ? slipFile.name : 'แตะเพื่ออัปโหลดสลิป'}
                    </span>
                    <span className="text-xs text-muted">JPG, PNG, PDF · สูงสุด 5MB</span>
                  </label>
                  <input
                    id="slip"
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleSlipChange}
                    className="sr-only"
                  />
                  {slipStatus === 'pending_review' && (
                    <p className="mt-2 text-sm text-success">
                      อัปโหลดสลิปแล้ว — รอเจ้าหน้าที่ตรวจสอบ (ไม่ใช่การยืนยันอัตโนมัติ)
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          {validationIssues?.issues && (
            <BannerAlert variant="error">
              <h2 className="mb-2 font-semibold text-error">ราคา/สต็อกมีการเปลี่ยนแปลง</h2>
              <ul className="space-y-1">
                {validationIssues.issues.map((iss, idx) => (
                  <li key={idx}>
                    {iss.type === 'price_changed'
                      ? `ราคาเปลี่ยนจาก ${fmtTHB(iss.expected_unit_price)} เป็น ${fmtTHB(iss.current_unit_price)}`
                      : iss.message}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">
                ระบบได้อัปเดตตะกร้าให้แล้ว กรุณากด "ยืนยันสั่งซื้อ" อีกครั้ง
              </p>
            </BannerAlert>
          )}
        </div>

        <OrderSummaryCard
          className="h-fit"
          subtotal={orderTotals.subtotal}
          shippingFee={orderTotals.shippingFee}
          shippingBase={orderTotals.shippingBase}
          shippingLabel={orderTotals.hasFreeShipping ? 'ส่งฟรี' : shippingLabel}
          promoBreakdown={orderTotals.breakdown}
          grandTotal={orderTotals.grandTotal}
          itemLines={items.map((i) => ({
            key: i.tiktok_sku_id,
            label: `${getSkuDisplayName(i)} × ${i.quantity}`,
            amount: fmtTHB(i.unit_price * i.quantity),
          }))}
          submitLabel="ยืนยันสั่งซื้อ"
          submitType="submit"
          submitting={submitting}
        />
      </div>
    </form>
    </>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-body-strong">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="input" />
    </div>
  );
}

function PaymentOption({ checked, onSelect, title, desc }) {
  return (
    <label
      className={`card-canvas flex cursor-pointer items-start gap-3 p-4 transition ${
        checked ? 'ring-2 ring-primary' : ''
      }`}
    >
      <input type="radio" name="payment" checked={checked} onChange={onSelect} className="mt-1" />
      <span>
        <span className="block font-medium text-ink">{title}</span>
        <span className="block text-sm text-muted">{desc}</span>
      </span>
    </label>
  );
}
