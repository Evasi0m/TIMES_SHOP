import { useEffect, useMemo, useState } from 'react';
import AdminFormSection from '../../components/admin/AdminFormSection.jsx';
import AdminPageShell from '../../components/admin/AdminPageShell.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useShipping } from '../../context/ShippingContext.jsx';
import { shopApi } from '../../lib/shop-api.js';
import { mapError } from '../../lib/error-map.js';

function createEmptyItem(sortOrder) {
  return {
    id: crypto.randomUUID(),
    text: '',
    link_url: '',
    sort_order: sortOrder,
    is_active: true,
  };
}

function AnnouncementPreview({ enabled, items }) {
  const activeItems = items.filter((item) => item.is_active && item.text.trim());
  if (!enabled || !activeItems.length) {
    return <p className="text-sm text-muted">ปิดอยู่ — เปิดแถบประกาศและเพิ่มข้อความเพื่อดูตัวอย่าง</p>;
  }

  const label = activeItems.map((item) => item.text.trim()).join(' / ');

  return (
    <div className="announcement-bar announcement-bar--preview" role="marquee" aria-live="polite">
      <div className="announcement-bar__viewport">
        <div className="announcement-bar__track announcement-bar__track--static">
          <span className="announcement-bar__content">{label}</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminAnnouncementPage() {
  const toast = useToast();
  const { refresh } = useShipping();
  const [enabled, setEnabled] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    shopApi.adminGetAnnouncement().then((res) => {
      if (!active) return;
      if (res.ok) {
        setEnabled(Boolean(res.enabled));
        setItems(
          (res.items ?? []).map((item, index) => ({
            id: item.id,
            text: item.text ?? '',
            link_url: item.link_url ?? '',
            sort_order: item.sort_order ?? index,
            is_active: item.is_active !== false,
          })),
        );
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.sort_order - b.sort_order),
    [items],
  );

  function updateItem(id, patch) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, createEmptyItem(prev.length)]);
  }

  function removeItem(id) {
    setItems((prev) =>
      prev
        .filter((item) => item.id !== id)
        .map((item, index) => ({ ...item, sort_order: index })),
    );
  }

  function moveItem(id, direction) {
    setItems((prev) => {
      const ordered = [...prev].sort((a, b) => a.sort_order - b.sort_order);
      const index = ordered.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= ordered.length) return prev;
      const next = [...ordered];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((item, sortIndex) => ({ ...item, sort_order: sortIndex }));
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    const payloadItems = sortedItems.map((item, index) => ({
      id: item.id,
      text: item.text.trim(),
      link_url: item.link_url.trim() || null,
      sort_order: index,
      is_active: item.is_active,
    }));

    if (enabled && payloadItems.some((item) => !item.text)) {
      toast.error('กรุณากรอกข้อความทุกรายการ หรือลบรายการที่ว่าง');
      return;
    }

    setSaving(true);
    try {
      const res = await shopApi.adminSaveAnnouncement({ enabled, items: payloadItems });
      if (!res.ok) {
        toast.error(mapError(res));
        return;
      }
      setEnabled(Boolean(res.enabled));
      setItems(
        (res.items ?? []).map((item, index) => ({
          id: item.id,
          text: item.text ?? '',
          link_url: item.link_url ?? '',
          sort_order: item.sort_order ?? index,
          is_active: item.is_active !== false,
        })),
      );
      await refresh();
      toast.success('บันทึกประกาศวิ่งแล้ว — มีผลบนหน้าร้านทันที');
    } catch (err) {
      toast.error(mapError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageShell
      title="ประกาศวิ่ง"
      subtitle="แถบข้อความใต้หัวเว็บ — วิ่งจากขวาไปซ้ายบนหน้าร้าน (ไม่แสดงในหน้า admin)"
    >
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="admin-card admin-card--pad admin-preview-panel">
          <div>
            <p className="admin-preview-panel__label">สถานะ</p>
            <p className="admin-preview-panel__value">{enabled ? 'เปิดใช้งาน' : 'ปิดอยู่'}</p>
          </div>
          <div className="admin-preview-panel__sample">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              ตัวอย่างบนหน้าร้าน
            </p>
            <AnnouncementPreview enabled={enabled} items={sortedItems} />
          </div>
        </section>

        <section className="admin-card admin-card--pad">
          <form onSubmit={handleSave}>
            <AdminFormSection
              title="ตั้งค่าแถบประกาศ"
              description="เพิ่มหลายข้อความได้ — คั่นด้วย / บนหน้าร้าน ลิงก์เป็น optional"
            >
              <label className="flex min-h-[44px] items-center gap-3 text-sm font-semibold text-body-strong">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  disabled={loading || saving}
                />
                เปิดแถบประกาศบนหน้าร้าน
              </label>

              <div className="space-y-4">
                {sortedItems.map((item, index) => (
                  <div key={item.id} className="rounded-xl border border-hairline-soft p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-body-strong">ประกาศ #{index + 1}</p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="icon-btn text-muted"
                          aria-label="เลื่อนขึ้น"
                          disabled={index === 0 || loading || saving}
                          onClick={() => moveItem(item.id, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="icon-btn text-muted"
                          aria-label="เลื่อนลง"
                          disabled={index === sortedItems.length - 1 || loading || saving}
                          onClick={() => moveItem(item.id, 1)}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="icon-btn text-error"
                          aria-label="ลบประกาศ"
                          disabled={loading || saving}
                          onClick={() => removeItem(item.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-body-strong">
                          ข้อความ
                        </label>
                        <input
                          type="text"
                          value={item.text}
                          maxLength={500}
                          onChange={(e) => updateItem(item.id, { text: e.target.value })}
                          className="input"
                          placeholder="เช่น ส่งฟรีเมื่อสั่งครบ 500 บาท"
                          disabled={loading || saving}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-body-strong">
                          ลิงก์ (ไม่บังคับ)
                        </label>
                        <input
                          type="url"
                          value={item.link_url}
                          onChange={(e) => updateItem(item.id, { link_url: e.target.value })}
                          className="input"
                          placeholder="https://..."
                          disabled={loading || saving}
                        />
                      </div>
                      <label className="flex min-h-[44px] items-center gap-3 text-sm text-body">
                        <input
                          type="checkbox"
                          checked={item.is_active}
                          onChange={(e) => updateItem(item.id, { is_active: e.target.checked })}
                          disabled={loading || saving}
                        />
                        แสดงรายการนี้
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn-secondary min-h-[44px] w-full"
                onClick={addItem}
                disabled={loading || saving}
              >
                + เพิ่มประกาศ
              </button>
            </AdminFormSection>

            <div className="admin-form-footer">
              <button type="submit" disabled={loading || saving} className="btn-admin-primary min-h-[44px]">
                {saving ? 'กำลังบันทึก...' : 'บันทึกประกาศวิ่ง'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AdminPageShell>
  );
}
