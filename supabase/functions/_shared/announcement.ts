export type AnnouncementItemRow = {
  id: string;
  text: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export type AnnouncementItemInput = {
  id?: string;
  text?: string;
  link_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export function toClientAnnouncementItem(row: AnnouncementItemRow) {
  return {
    id: row.id,
    text: row.text,
    link_url: row.link_url,
  };
}

export function toAdminAnnouncementItem(row: AnnouncementItemRow) {
  return {
    id: row.id,
    text: row.text,
    link_url: row.link_url,
    sort_order: row.sort_order,
    is_active: row.is_active,
  };
}

export function validateAnnouncementItem(item: AnnouncementItemInput, index: number) {
  const text = String(item.text ?? '').trim();
  if (!text) {
    return { ok: false as const, message: `รายการที่ ${index + 1}: กรุณากรอกข้อความ` };
  }
  if (text.length > 500) {
    return { ok: false as const, message: `รายการที่ ${index + 1}: ข้อความยาวเกิน 500 ตัวอักษร` };
  }
  const linkUrl = item.link_url == null || item.link_url === '' ? null : String(item.link_url).trim();
  if (linkUrl) {
    try {
      const url = new URL(linkUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return { ok: false as const, message: `รายการที่ ${index + 1}: ลิงก์ต้องขึ้นต้นด้วย http หรือ https` };
      }
    } catch {
      return { ok: false as const, message: `รายการที่ ${index + 1}: ลิงก์ไม่ถูกต้อง` };
    }
  }
  return {
    ok: true as const,
    id: item.id ? String(item.id) : undefined,
    text,
    link_url: linkUrl,
    sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : index,
    is_active: item.is_active !== false,
  };
}
