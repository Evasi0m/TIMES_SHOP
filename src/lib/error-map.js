// Map Supabase / shop-* API errors to Thai user-facing messages.

const MESSAGES = {
  // Auth (Supabase)
  'Invalid login credentials': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  'User already registered': 'อีเมลนี้ใช้งานแล้ว — กรุณาใช้อีเมลอื่น',
  'Email already registered': 'อีเมลนี้ใช้งานแล้ว — กรุณาใช้อีเมลอื่น',
  'Password should be at least 6 characters': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
  'Unable to validate email address: invalid format': 'รูปแบบอีเมลไม่ถูกต้อง',

  // shop-* contract error codes
  unauthorized: 'กรุณาเข้าสู่ระบบ',
  stock_insufficient: 'สินค้าบางรายการมีไม่พอ',
  price_changed: 'ราคาสินค้ามีการเปลี่ยนแปลง',
  validation_failed: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
  expired: 'โค้ดนี้หมดอายุแล้ว',
  exhausted: 'โค้ดนี้ถูกใช้ครบจำนวนแล้ว',
  per_user_limit: 'คุณใช้โค้ดนี้ครบจำนวนที่กำหนดแล้ว',
  not_redeemable: 'โปรนี้ไม่รองรับการกรอกโค้ด',
  inactive: 'โปรนี้ยังไม่เปิดใช้งาน',
  duplicate_code: 'โค้ดสาธารณะนี้ถูกใช้แล้ว กรุณาใช้โค้ดอื่น',
  min_order_not_met: 'ยอดสั่งซื้อยังไม่ถึงขั้นต่ำของโค้ดนี้',
  invalid_file: 'ไฟล์สลิปไม่ถูกต้อง (รองรับ JPG/PNG/PDF ไม่เกิน 5MB)',
  google_unconfigured: 'ยังไม่ได้ตั้งค่า Google Sign-in',
  network_error: 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ — กรุณาลองใหม่อีกครั้ง',
  'Failed to send a request to the Edge Function':
    'ยังไม่พร้อมบนเซิร์ฟเวอร์ — กรุณาลองใหม่ภายหลังหรือติดต่อผู้ดูแลระบบ',
};

export function mapError(error) {
  if (!error) return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
  const key = typeof error === 'string' ? error : error.code || error.message || error.error || '';
  const msg = typeof error === 'string' ? error : error.message;
  return MESSAGES[key] || MESSAGES[msg] || msg || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}
