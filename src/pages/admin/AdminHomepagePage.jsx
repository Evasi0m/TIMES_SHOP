import { useEffect, useMemo, useState } from 'react';
import AdminFormSection from '../../components/admin/AdminFormSection.jsx';
import AdminPageShell from '../../components/admin/AdminPageShell.jsx';
import HomeBlockRenderer from '../../components/home/HomeBlockRenderer.jsx';
import HomeStoreProfile from '../../components/home/HomeStoreProfile.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useShipping } from '../../context/ShippingContext.jsx';
import { shopApi } from '../../lib/shop-api.js';
import { mapError } from '../../lib/error-map.js';
import {
  BANNER_ASPECTS,
  BANNER_LAYOUTS,
  BANNER_LINK_TYPE_OPTIONS,
  PRODUCT_ROW_SOURCES,
  createEmptyBannerImage,
  createEmptyBlock,
  normalizeBannerImage,
} from '../../lib/homepage.js';

function BlockPreview({ block }) {
  return (
    <div className="home-preview-frame">
      <HomeBlockRenderer block={block} />
    </div>
  );
}

function BannerEditor({ block, onChange }) {
  const config = block.config ?? {};
  const images = Array.isArray(config.images) ? config.images : [];

  function updateConfig(patch) {
    onChange({ ...block, config: { ...config, ...patch } });
  }

  function updateImage(index, patch) {
    const next = images.map((img, i) => {
      if (i !== index) return img;
      const merged = normalizeBannerImage({ ...img, ...patch });
      if (patch.link_type === 'none') {
        return { ...merged, tiktok_product_id: '', tiktok_sku_id: '', link_url: '' };
      }
      if (patch.link_type === 'product') {
        return { ...merged, link_url: '' };
      }
      if (patch.link_type === 'url') {
        return { ...merged, tiktok_product_id: '', tiktok_sku_id: '' };
      }
      return merged;
    });
    updateConfig({ images: next });
  }

  function linkTypeFor(image) {
    return normalizeBannerImage(image).link_type;
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-body-strong">รูปแบบ</label>
          <select
            className="input"
            value={config.layout || 'slide'}
            onChange={(e) => updateConfig({ layout: e.target.value, aspect: e.target.value === 'row' ? '1:1' : config.aspect || '16:9' })}
          >
            {BANNER_LAYOUTS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
        {config.layout !== 'row' && (
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-body-strong">อัตราส่วน</label>
            <select
              className="input"
              value={config.aspect || '16:9'}
              onChange={(e) => updateConfig({ aspect: e.target.value })}
            >
              {BANNER_ASPECTS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {images.map((image, index) => {
        const linkType = linkTypeFor(image);
        return (
        <div key={`banner-image-${index}`} className="rounded-xl border border-hairline-soft p-3 space-y-2">
          <p className="text-sm font-semibold text-body-strong">รูปที่ {index + 1}</p>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-body-strong">URL รูป</label>
            <input
              type="url"
              className="input"
              placeholder="https://..."
              value={image.image_url || ''}
              onChange={(e) => updateImage(index, { image_url: e.target.value })}
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="mb-1.5 text-sm font-semibold text-body-strong">เมื่อคลิกแบนเนอร์</legend>
            <div className="flex flex-wrap gap-3">
              {BANNER_LINK_TYPE_OPTIONS.map((opt) => (
                <label key={opt.id} className="flex min-h-[36px] items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`banner-link-${block.id}-${index}`}
                    checked={linkType === opt.id}
                    onChange={() => updateImage(index, { link_type: opt.id })}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
          {linkType === 'product' && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-body-strong">TikTok Product ID</label>
                <input
                  type="text"
                  className="input"
                  placeholder="1734098765432109876"
                  value={image.tiktok_product_id || ''}
                  onChange={(e) => updateImage(index, { tiktok_product_id: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-body-strong">SKU ID (ไม่บังคับ)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="1734123456789012345"
                  value={image.tiktok_sku_id || ''}
                  onChange={(e) => updateImage(index, { tiktok_sku_id: e.target.value })}
                />
              </div>
            </>
          )}
          {linkType === 'url' && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-body-strong">ลิงก์</label>
              <input
                type="text"
                className="input"
                placeholder="/catalog หรือ /product/p/... หรือ https://..."
                value={image.link_url || ''}
                onChange={(e) => updateImage(index, { link_url: e.target.value })}
              />
            </div>
          )}
          <button
            type="button"
            className="btn-secondary min-h-[36px] text-sm"
            onClick={() => updateConfig({ images: images.filter((_, i) => i !== index) })}
          >
            ลบรูป
          </button>
        </div>
        );
      })}

      <button
        type="button"
        className="btn-secondary min-h-[40px] w-full"
        onClick={() => updateConfig({ images: [...images, createEmptyBannerImage()] })}
      >
        + เพิ่มรูป
      </button>
    </div>
  );
}

function ProductRowEditor({ block, onChange }) {
  const config = block.config ?? {};
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-body-strong">แหล่งข้อมูล</label>
        <select
          className="input"
          value={config.source || 'best_selling'}
          onChange={(e) => onChange({ ...block, config: { ...config, source: e.target.value } })}
        >
          {PRODUCT_ROW_SOURCES.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-body-strong">จำนวนสินค้า</label>
        <input
          type="number"
          min="4"
          max="20"
          className="input"
          value={config.limit ?? 10}
          onChange={(e) => onChange({ ...block, config: { ...config, limit: Number(e.target.value) } })}
        />
      </div>
    </div>
  );
}

export default function AdminHomepagePage() {
  const toast = useToast();
  const { refresh: refreshShipping } = useShipping();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [profileDraft, setProfileDraft] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverDraft, setCoverDraft] = useState('');
  const [unitsSoldDraft, setUnitsSoldDraft] = useState('');
  const [unitsSoldSaved, setUnitsSoldSaved] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([shopApi.adminGetHomepage(), shopApi.adminGetShopSettings()]).then(([homepageRes, settingsRes]) => {
      if (!active) return;
      if (homepageRes.ok) {
        const next = (homepageRes.blocks ?? []).map((block, index) => ({
          id: block.id,
          kind: block.kind,
          title: block.title ?? '',
          config: block.config ?? {},
          sort_order: block.sort_order ?? index,
          is_active: block.is_active !== false,
        }));
        setBlocks(next);
        setPreviewId(next[0]?.id ?? null);
      }
      if (settingsRes.ok) {
        const url = settingsRes.profile_image_url ? String(settingsRes.profile_image_url) : '';
        setProfileImageUrl(url);
        setProfileDraft(url);
        const coverUrl = settingsRes.cover_image_url ? String(settingsRes.cover_image_url) : '';
        setCoverImageUrl(coverUrl);
        setCoverDraft(coverUrl);
        const units =
          settingsRes.units_sold_display != null ? String(settingsRes.units_sold_display) : '';
        setUnitsSoldSaved(units);
        setUnitsSoldDraft(units);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const sortedBlocks = useMemo(
    () => [...blocks].sort((a, b) => a.sort_order - b.sort_order),
    [blocks],
  );

  const previewBlock = sortedBlocks.find((b) => b.id === previewId) || sortedBlocks[0];

  function updateBlock(id, patch) {
    setBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, ...patch } : block)));
  }

  function moveBlock(id, direction) {
    setBlocks((prev) => {
      const ordered = [...prev].sort((a, b) => a.sort_order - b.sort_order);
      const index = ordered.findIndex((b) => b.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= ordered.length) return prev;
      const next = [...ordered];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((block, sortIndex) => ({ ...block, sort_order: sortIndex }));
    });
  }

  function addBlock(kind) {
    setBlocks((prev) => {
      const block = createEmptyBlock(kind, prev.length);
      setPreviewId(block.id);
      return [...prev, block];
    });
  }

  function removeBlock(id) {
    setBlocks((prev) => prev.filter((b) => b.id !== id).map((b, i) => ({ ...b, sort_order: i })));
  }

  const profileDirty = profileDraft.trim() !== profileImageUrl.trim();
  const coverDirty = coverDraft.trim() !== coverImageUrl.trim();
  const unitsDirty = unitsSoldDraft.trim() !== unitsSoldSaved.trim();

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await shopApi.adminUpdateShopSettings({
        profile_image_url: profileDraft.trim() || null,
        cover_image_url: coverDraft.trim() || null,
        units_sold_display: unitsSoldDraft.trim() === '' ? null : Number(unitsSoldDraft),
      });
      if (!res.ok) {
        toast.error(mapError(res));
        return;
      }
      const savedProfile =
        'profile_image_url' in res
          ? res.profile_image_url
            ? String(res.profile_image_url)
            : ''
          : profileDraft.trim();
      const savedCover =
        'cover_image_url' in res
          ? res.cover_image_url
            ? String(res.cover_image_url)
            : ''
          : coverDraft.trim();
      setProfileImageUrl(savedProfile);
      setProfileDraft(savedProfile);
      setCoverImageUrl(savedCover);
      setCoverDraft(savedCover);
      const savedUnits =
        'units_sold_display' in res && res.units_sold_display != null
          ? String(res.units_sold_display)
          : unitsSoldDraft.trim();
      setUnitsSoldSaved(savedUnits);
      setUnitsSoldDraft(savedUnits);
      await refreshShipping();
      toast.success('บันทึกโปรไฟล์ร้านแล้ว');
    } catch (err) {
      toast.error(mapError(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        blocks: sortedBlocks.map((block, index) => ({
          id: block.id,
          kind: block.kind,
          title: block.title?.trim() || null,
          config: block.config,
          sort_order: index,
          is_active: block.is_active,
        })),
      };
      const res = await shopApi.adminSaveHomepage(payload);
      if (!res.ok) {
        toast.error(mapError(res));
        return;
      }
      const next = (res.blocks ?? []).map((block, index) => ({
        id: block.id,
        kind: block.kind,
        title: block.title ?? '',
        config: block.config ?? {},
        sort_order: block.sort_order ?? index,
        is_active: block.is_active !== false,
      }));
      setBlocks(next);
      toast.success('บันทึกหน้าแรกแล้ว — มีผลทันที');
    } catch (err) {
      toast.error(mapError(err));
    } finally {
      setSaving(false);
    }
  }

  const kindLabel = {
    banner: 'แบนเนอร์',
    product_row: 'แถวสินค้า',
    coupon_row: 'แถวคูปอง',
  };

  return (
    <AdminPageShell
      wide
      title="ออกแบบหน้าแรก"
      subtitle="จัดบล็อกหน้าแรกแบบ TikTok Shop — banner, แถวสินค้า, และคูปอง"
    >
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <section className="admin-card admin-card--pad admin-preview-panel">
          <div>
            <p className="admin-preview-panel__label">ตัวอย่างหน้าแรก</p>
            <p className="admin-preview-panel__value">โปรไฟล์ร้าน + บล็อก</p>
          </div>
          <div className="admin-preview-panel__sample space-y-4">
            <HomeStoreProfile
              preview
              profileImageUrl={profileDraft.trim() || null}
              coverImageUrl={coverDraft.trim() || null}
            />
            {previewBlock ? <BlockPreview block={previewBlock} /> : (
              <p className="text-sm text-muted">ยังไม่มีบล็อก — เพิ่มบล็อกด้านขวา</p>
            )}
          </div>
        </section>

        <section className="admin-card admin-card--pad space-y-6">
          <form onSubmit={handleSaveProfile}>
            <AdminFormSection
              title="โปรไฟล์ร้าน"
              description="รูป cover และโปรไฟล์แสดงบนการ์ดร้านด้านบนหน้าแรก"
            >
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-body-strong">URL รูป cover</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={coverDraft}
                  onChange={(e) => setCoverDraft(e.target.value)}
                />
                <p className="mt-1.5 text-xs text-muted">
                  รูปพื้นหลังครึ่งบนการ์ด (http/https) — แนะนำแนวนอน 16:9
                </p>
              </div>
              {coverDraft.trim() ? (
                <div>
                  <img
                    src={coverDraft.trim()}
                    alt=""
                    className="aspect-[16/9] w-full max-w-xs rounded-xl object-cover border border-hairline-soft"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="mt-1.5 block text-xs text-muted">ตัวอย่าง cover</span>
                </div>
              ) : null}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-body-strong">URL รูปโปรไฟล์</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={profileDraft}
                  onChange={(e) => setProfileDraft(e.target.value)}
                />
                <p className="mt-1.5 text-xs text-muted">
                  วาง URL รูปโปรไฟล์ร้าน (http/https) — ไม่รองรับอัปโหลด
                </p>
              </div>
              {profileDraft.trim() ? (
                <div className="flex items-center gap-3">
                  <img
                    src={profileDraft.trim()}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover border border-hairline-soft"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="text-xs text-muted">ตัวอย่างวงกลม</span>
                </div>
              ) : null}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-body-strong">
                  ยอดขายที่แสดง (ว่าง = คำนวณจากแคตตาล็อก)
                </label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  placeholder="เช่น 1500"
                  value={unitsSoldDraft}
                  onChange={(e) => setUnitsSoldDraft(e.target.value)}
                />
                <p className="mt-1.5 text-xs text-muted">
                  ตั้งค่าเพื่อไม่ต้องสแกนแคตตาล็อกทั้งร้าน — แสดงบนโปรไฟล์หน้าแรก
                </p>
              </div>
              <div className="admin-form-footer !mt-4 !pt-0 !border-0">
                <button
                  type="submit"
                  disabled={loading || savingProfile || (!profileDirty && !coverDirty && !unitsDirty)}
                  className="btn-admin-primary min-h-[44px]"
                >
                  {savingProfile ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์ร้าน'}
                </button>
              </div>
            </AdminFormSection>
          </form>

          <form onSubmit={handleSave}>
            <AdminFormSection
              title="บล็อกหน้าแรก"
              description="เรียงลำดับจากบนลงล่าง — บันทึกแล้วมีผลทันทีบนหน้าร้าน"
            >
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-secondary min-h-[40px]" onClick={() => addBlock('banner')}>
                  + แบนเนอร์
                </button>
                <button type="button" className="btn-secondary min-h-[40px]" onClick={() => addBlock('product_row')}>
                  + แถวสินค้า
                </button>
                <button type="button" className="btn-secondary min-h-[40px]" onClick={() => addBlock('coupon_row')}>
                  + แถวคูปอง
                </button>
              </div>

              <div className="space-y-4">
                {sortedBlocks.map((block, index) => (
                  <div key={block.id} className="rounded-xl border border-hairline-soft p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className="text-left text-sm font-semibold text-body-strong"
                        onClick={() => setPreviewId(block.id)}
                      >
                        {index + 1}. {kindLabel[block.kind]} {previewId === block.id ? '(กำลังดูตัวอย่าง)' : ''}
                      </button>
                      <div className="flex items-center gap-1">
                        <button type="button" className="icon-btn text-muted" onClick={() => moveBlock(block.id, -1)} disabled={index === 0}>↑</button>
                        <button type="button" className="icon-btn text-muted" onClick={() => moveBlock(block.id, 1)} disabled={index === sortedBlocks.length - 1}>↓</button>
                        <button type="button" className="icon-btn text-error" onClick={() => removeBlock(block.id)}>×</button>
                      </div>
                    </div>

                    <label className="flex min-h-[40px] items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={block.is_active}
                        onChange={(e) => updateBlock(block.id, { is_active: e.target.checked })}
                      />
                      แสดงบล็อกนี้
                    </label>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-body-strong">หัวข้อ</label>
                      <input
                        type="text"
                        className="input"
                        value={block.title}
                        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                      />
                    </div>

                    {block.kind === 'banner' && (
                      <BannerEditor block={block} onChange={(next) => updateBlock(block.id, next)} />
                    )}
                    {block.kind === 'product_row' && (
                      <ProductRowEditor block={block} onChange={(next) => updateBlock(block.id, next)} />
                    )}
                    {block.kind === 'coupon_row' && (
                      <p className="text-sm text-muted">แสดงคูปองที่เปิดใช้งานจากระบบโปรโมชั่น (broadcast + โค้ดสาธารณะ)</p>
                    )}
                  </div>
                ))}
              </div>
            </AdminFormSection>

            <div className="admin-form-footer">
              <button type="submit" disabled={loading || saving} className="btn-admin-primary min-h-[44px]">
                {saving ? 'กำลังบันทึก...' : 'บันทึกหน้าแรก'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AdminPageShell>
  );
}
