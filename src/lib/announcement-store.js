const STORAGE_KEY = 'times_shop_announcement';

const DEFAULT_ITEMS = [
  {
    id: 'mock-announce-1',
    text: 'ส่งฟรีเมื่อสั่งครบ 500 บาท',
    link_url: null,
    sort_order: 0,
    is_active: true,
  },
  {
    id: 'mock-announce-2',
    text: 'โปรโมชั่นพิเศษสำหรับสมาชิกใหม่',
    link_url: null,
    sort_order: 1,
    is_active: true,
  },
];

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { enabled: false, items: DEFAULT_ITEMS.map((item) => ({ ...item })) };
    }
    const parsed = JSON.parse(raw);
    return {
      enabled: Boolean(parsed.enabled),
      items: Array.isArray(parsed.items) ? parsed.items : DEFAULT_ITEMS.map((item) => ({ ...item })),
    };
  } catch {
    return { enabled: false, items: DEFAULT_ITEMS.map((item) => ({ ...item })) };
  }
}

function writeState(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      enabled: Boolean(state.enabled),
      items: state.items,
    }),
  );
}

export function getMockAnnouncementState() {
  return readState();
}

export function getPublicAnnouncement() {
  const { enabled, items } = readState();
  const activeItems = items
    .filter((item) => item.is_active !== false && String(item.text ?? '').trim())
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(({ id, text, link_url }) => ({ id, text, link_url: link_url || null }));

  return {
    enabled: enabled && activeItems.length > 0,
    items: enabled ? activeItems : [],
  };
}

export function saveMockAnnouncement({ enabled, items }) {
  const validated = (items ?? []).map((item, index) => {
    const text = String(item.text ?? '').trim();
    if (!text) throw new Error(`รายการที่ ${index + 1}: กรุณากรอกข้อความ`);
    if (text.length > 500) throw new Error(`รายการที่ ${index + 1}: ข้อความยาวเกิน 500 ตัวอักษร`);
    const linkUrl = item.link_url == null || item.link_url === '' ? null : String(item.link_url).trim();
    if (linkUrl) {
      const url = new URL(linkUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error(`รายการที่ ${index + 1}: ลิงก์ต้องขึ้นต้นด้วย http หรือ https`);
      }
    }
    return {
      id: item.id || crypto.randomUUID(),
      text,
      link_url: linkUrl,
      sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : index,
      is_active: item.is_active !== false,
    };
  });

  const state = { enabled: Boolean(enabled), items: validated };
  writeState(state);
  return state;
}
