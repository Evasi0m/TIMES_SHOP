import { useEffect, useState } from 'react';
import AdminPageShell from '../../components/admin/AdminPageShell.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { shopApi } from '../../lib/shop-api.js';
import { fmtTHB } from '../../lib/money.js';
import { mapError } from '../../lib/error-map.js';

export default function AdminProductsPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(search = q) {
    setLoading(true);
    const res = await shopApi.adminProductsList({ q: search, page: 1, page_size: 50 });
    if (res.ok) setItems(res.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function togglePublish(item) {
    const res = await shopApi.adminProductUpdate({
      tiktok_sku_id: item.tiktok_sku_id,
      is_published: !item.is_published,
    });
    if (!res.ok) {
      toast.error(mapError(res));
      return;
    }
    toast.success(item.is_published ? 'ซ่อนสินค้าแล้ว' : 'เผยแพร่แล้ว');
    load();
  }

  async function softDelete(item) {
    if (!confirm(`ลบ ${item.product_name} ออกจากเว็บ?`)) return;
    const res = await shopApi.adminProductUpdate({
      tiktok_sku_id: item.tiktok_sku_id,
      soft_delete: true,
    });
    if (!res.ok) {
      toast.error(mapError(res));
      return;
    }
    toast.success('ลบแล้ว');
    load();
  }

  return (
    <AdminPageShell title="จัดการสินค้า" subtitle="เปิด/ปิด/ลบ SKU บนเว็บ (ไม่กระทบ POS)">
      <div className="mt-6 flex gap-2">
        <input
          className="input flex-1"
          placeholder="ค้นหาชื่อ / SKU"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="button" className="btn-admin-primary" onClick={() => load(q)}>ค้นหา</button>
      </div>

      <div className="admin-card admin-card--pad mt-4 overflow-x-auto">
        {loading ? (
          <p className="text-muted">กำลังโหลด...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="pb-2">สินค้า</th>
                <th className="pb-2">ราคา</th>
                <th className="pb-2">สต็อก</th>
                <th className="pb-2">สถานะ</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.tiktok_sku_id} className="border-t border-hairline">
                  <td className="py-3 pr-2">
                    <p className="font-medium text-ink">{item.product_name}</p>
                    <p className="text-xs text-muted">{item.sku_name || item.tiktok_sku_id}</p>
                  </td>
                  <td className="py-3">{fmtTHB(item.unit_price)}</td>
                  <td className="py-3">{item.stock_available}</td>
                  <td className="py-3">
                    {item.deleted_at ? (
                      <span className="text-error">ลบแล้ว</span>
                    ) : item.is_published ? (
                      <span className="text-success">เผยแพร่</span>
                    ) : (
                      <span className="text-warning">ซ่อน</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {!item.deleted_at && (
                      <>
                        <button type="button" className="btn-admin-secondary mr-2 text-xs" onClick={() => togglePublish(item)}>
                          {item.is_published ? 'ซ่อน' : 'เผยแพร่'}
                        </button>
                        <button type="button" className="btn-admin-secondary text-xs text-error" onClick={() => softDelete(item)}>
                          ลบ
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminPageShell>
  );
}
