import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { shopApi } from '../lib/shop-api.js';
import ProductCard from '../components/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/Skeleton.jsx';
import SectionHeader from '../components/layout/SectionHeader.jsx';
import BannerAlert from '../components/ui/BannerAlert.jsx';
import { SHOP_NAME } from '../lib/config.js';
import { useShipping } from '../context/ShippingContext.jsx';

export default function HomePage() {
  const { shippingPromoText } = useShipping();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    shopApi.getCatalog({
      page: 1,
      page_size: 8,
      include_facets: false,
      include_items: true,
    }).then((res) => {
      if (!active) return;
      if (res.ok) {
        setItems(res.items);
        setError(null);
      } else {
        setError(res.message || res.error || 'โหลดสินค้าไม่สำเร็จ');
      }
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setError('โหลดสินค้าไม่สำเร็จ');
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="card-canvas flex min-h-[160px] flex-col justify-center p-6 lg:p-10">
        <p className="text-sm text-muted">ยินดีต้อนรับสู่</p>
        <h1 className="font-display text-3xl text-ink lg:text-4xl">{SHOP_NAME}</h1>
        <p className="mt-2 max-w-md text-base text-body">
          นาฬิกาและแฟชั่น · {shippingPromoText}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link to="/catalog" className="btn-primary">
            เลือกซื้อสินค้า
          </Link>
        </div>
      </section>

      <section className="space-y-4 lg:space-y-6">
        <SectionHeader title="สินค้าแนะนำ" action={{ label: 'ดูทั้งหมด', href: '/catalog' }} />
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : error ? (
          <BannerAlert variant="error">{error}</BannerAlert>
        ) : (
          <div className="product-grid">
            {items.map((p) => (
              <ProductCard key={p.tiktok_product_id || p.tiktok_sku_id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
