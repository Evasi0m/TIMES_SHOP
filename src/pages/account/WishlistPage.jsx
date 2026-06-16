import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext.jsx';
import ProductImage from '../../components/ProductImage.jsx';
import { fmtTHB } from '../../lib/money.js';
import EmptyState from '../../components/EmptyState.jsx';

export default function WishlistPage() {
  const { items, toggleWishlist } = useWishlist();

  if (items.length === 0) {
    return (
      <EmptyState
        title="ยังไม่มีรายการโปรด"
        description="กดไอคอนหัวใจที่สินค้าเพื่อบันทึกไว้ดูภายหลัง"
        actionLabel="เลือกซื้อสินค้า"
        actionTo="/catalog"
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/account" className="text-sm text-muted transition hover:text-primary">
          ← กลับบัญชี
        </Link>
        <h1 className="mt-2 font-display text-3xl text-ink lg:text-4xl">
          รายการโปรด ({items.length})
        </h1>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.tiktok_sku_id} className="card-canvas flex gap-3 p-3">
            <Link to={`/product/${item.tiktok_sku_id}`} className="shrink-0">
              <ProductImage
                product={item}
                className="h-[72px] w-[72px] overflow-hidden rounded-md"
                imgClassName="h-full w-full object-cover"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                to={`/product/${item.tiktok_sku_id}`}
                className="line-clamp-2 font-medium text-ink"
              >
                {item.product_name}
              </Link>
              {item.sku_name && <p className="text-sm text-muted">{item.sku_name}</p>}
              {item.unit_price != null && (
                <p className="mt-1 text-primary font-semibold">{fmtTHB(item.unit_price)}</p>
              )}
            </div>
            <button
              type="button"
              className="icon-btn text-primary self-start"
              aria-label="ลบออกจากรายการโปรด"
              onClick={() => toggleWishlist(item)}
            >
              ♥
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
