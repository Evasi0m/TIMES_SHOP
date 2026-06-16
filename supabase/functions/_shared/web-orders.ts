const SLIP_BUCKET = 'payment-slips';

export function orderStatusLabel(
  status: string,
  paymentMethod: string,
  slipStatus: string | null,
): string {
  if (status === 'pending') {
    if (paymentMethod === 'transfer' && slipStatus === 'pending_review') return 'รอตรวจสลิป';
    return 'รอยืนยัน';
  }
  if (status === 'active') return 'ยืนยันแล้ว';
  if (status === 'voided') return 'ยกเลิก';
  return status;
}

type PosOrderRow = Record<string, unknown>;
type PosItemRow = Record<string, unknown>;

export function formatWebOrder(row: PosOrderRow) {
  const items = (Array.isArray(row.sale_order_items) ? row.sale_order_items : []) as PosItemRow[];
  const paymentMethod = String(row.payment_method || '');
  const status = String(row.status || 'pending');
  const slipStatus = row.payment_slip_status ? String(row.payment_slip_status) : null;

  return {
    order_id: row.id,
    web_order_number: row.web_order_number,
    status,
    status_label: orderStatusLabel(status, paymentMethod, slipStatus),
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
