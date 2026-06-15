export const PROMO_TYPES = {
  PRODUCT_DISCOUNT: 'product_discount',
  FREE_SHIPPING: 'free_shipping',
  COD_DISCOUNT: 'cod_discount',
  SPECIAL_DISCOUNT: 'special_discount',
};

export const PROMO_TYPE_LIST = Object.values(PROMO_TYPES);

export const DISCOUNT_MODES = {
  PERCENT: 'percent',
  AMOUNT: 'amount',
};

export const DISTRIBUTION_MODES = {
  DRAFT: 'draft',
  BROADCAST: 'broadcast',
  TARGETED: 'targeted',
};

export const PROMO_TYPE_LABELS = {
  [PROMO_TYPES.PRODUCT_DISCOUNT]: 'ส่วนลดสินค้า',
  [PROMO_TYPES.FREE_SHIPPING]: 'ส่งฟรี',
  [PROMO_TYPES.COD_DISCOUNT]: 'ส่วนลด COD',
  [PROMO_TYPES.SPECIAL_DISCOUNT]: 'ส่วนลดพิเศษ',
};

export const PROMO_TYPE_DESCRIPTIONS = {
  [PROMO_TYPES.PRODUCT_DISCOUNT]: 'ลดยอดสินค้า — ใช้ร่วมกับโปรประเภทอื่นได้',
  [PROMO_TYPES.FREE_SHIPPING]: 'ยกเว้นค่าจัดส่ง — ใช้ร่วมกับโปรประเภทอื่นได้',
  [PROMO_TYPES.COD_DISCOUNT]: 'ลดเพิ่มเมื่อชำระเก็บปลายทาง — ใช้ร่วมกับโปรประเภทอื่นได้',
  [PROMO_TYPES.SPECIAL_DISCOUNT]: 'ส่วนลดพิเศษเพิ่มเติม — ใช้ร่วมกับโปรประเภทอื่นได้',
};

export function getPromoTypeLabel(type) {
  return PROMO_TYPE_LABELS[type] || type;
}
