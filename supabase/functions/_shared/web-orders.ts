const SLIP_BUCKET = 'payment-slips';

export function orderStatusLabel(
  status: string,
  paymentMethod: string,
  slipStatus: string | null,
  fulfillmentStatus: string | null = null,
): string {
  if (status === 'voided') return 'ยกเลิก';
  if (status === 'pending') {
    if (paymentMethod === 'transfer' && slipStatus === 'pending_review') return 'รอตรวจสลิป';
    return 'รอยืนยัน';
  }
  if (status === 'active') {
    if (fulfillmentStatus === 'packing') return 'กำลังจัดเตรียม';
    if (fulfillmentStatus === 'shipped') return 'จัดส่งแล้ว';
    if (fulfillmentStatus === 'delivered') return 'ส่งถึงแล้ว';
    if (fulfillmentStatus === 'paid') return 'ชำระแล้ว';
    return 'ยืนยันแล้ว';
  }
  return status;
}

export function buildOrderTimeline(
  status: string,
  paymentMethod: string,
  slipStatus: string | null,
  fulfillmentStatus: string | null,
  trackingNo: string | null,
) {
  const steps = [
    { id: 'placed', label: 'สั่งซื้อแล้ว', done: true },
    {
      id: 'confirmed',
      label: 'ร้านยืนยัน',
      done: status === 'active' || status === 'voided',
    },
  ];
  if (paymentMethod === 'transfer') {
    steps.push({
      id: 'slip',
      label: slipStatus === 'approved' ? 'ตรวจสลิปแล้ว' : slipStatus === 'rejected' ? 'สลิปถูกปฏิเสธ' : 'รอตรวจสลิป',
      done: slipStatus === 'approved',
    });
  }
  if (status === 'active') {
    steps.push(
      { id: 'packing', label: 'กำลังจัดเตรียม', done: ['packing', 'shipped', 'delivered'].includes(fulfillmentStatus || '') },
      { id: 'shipped', label: trackingNo ? `จัดส่งแล้ว (${trackingNo})` : 'จัดส่งแล้ว', done: ['shipped', 'delivered'].includes(fulfillmentStatus || '') },
      { id: 'delivered', label: 'ส่งถึงแล้ว', done: fulfillmentStatus === 'delivered' },
    );
  }
  if (status === 'voided') {
    steps.push({ id: 'cancelled', label: 'ยกเลิกแล้ว', done: true });
  }
  return steps;
}

type PosOrderRow = Record<string, unknown>;
type PosItemRow = Record<string, unknown>;

export function formatWebOrder(row: PosOrderRow) {
  const items = (Array.isArray(row.sale_order_items) ? row.sale_order_items : []) as PosItemRow[];
  const paymentMethod = String(row.payment_method || '');
  const status = String(row.status || 'pending');
  const slipStatus = row.payment_slip_status ? String(row.payment_slip_status) : null;
  const fulfillmentStatus = row.web_fulfillment_status ? String(row.web_fulfillment_status) : null;
  const trackingNo = row.tracking_no ? String(row.tracking_no) : null;

  return {
    order_id: row.id,
    web_order_number: row.web_order_number,
    status,
    status_label: orderStatusLabel(status, paymentMethod, slipStatus, fulfillmentStatus),
    web_fulfillment_status: fulfillmentStatus,
    tracking_no: trackingNo,
    shipped_at: row.shipped_at || null,
    timeline: buildOrderTimeline(status, paymentMethod, slipStatus, fulfillmentStatus, trackingNo),
    sale_date: row.sale_date,
    grand_total: Number(row.grand_total),
    payment_method: paymentMethod,
    payment_slip_status: slipStatus,
    shipping: {
      recipient_name: row.shipping_recipient_name || row.buyer_name || '',
      phone: row.shipping_phone || '',
      address: row.shipping_address || '',
      postal_code: row.shipping_postal_code || '',
    },
    items: items.map((it) => ({
      product_name: it.product_name,
      sku_name: it.sku_name,
      quantity: it.quantity,
      unit_price: Number(it.unit_price),
      image_url: it.sku_image_url || null,
    })),
  };
}

export function slipObjectKey(storagePath: string): string | null {
  const prefix = `${SLIP_BUCKET}/`;
  if (!storagePath.startsWith(prefix)) return null;
  return storagePath.slice(prefix.length);
}

export function slipPathForUser(userId: string | null, fileName: string): string {
  const folder = userId || 'guest';
  return `${SLIP_BUCKET}/${folder}/${fileName}`;
}

export const SLIP_MAX_BYTES = 5 * 1024 * 1024;
export const SLIP_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);

export function slipPathAllowedForUser(storagePath: string, userId: string | null): boolean {
  if (!storagePath.startsWith(`${SLIP_BUCKET}/`)) return false;
  const expectedPrefix = userId
    ? `${SLIP_BUCKET}/${userId}/`
    : `${SLIP_BUCKET}/guest/`;
  return storagePath.startsWith(expectedPrefix);
}
