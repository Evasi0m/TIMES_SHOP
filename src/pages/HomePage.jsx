import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { shopApi } from '../lib/shop-api.js';
import ProductCard from '../components/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/Skeleton.jsx';
import SectionHeader from '../components/layout/SectionHeader.jsx';
import BannerAlert from '../components/ui/BannerAlert.jsx';
import { SHOP_NAME } from '../lib/config.js';
import { useShipping } from '../context/ShippingContext.jsx';
import { getRecentlyViewed } from '../hooks/useRecentlyViewed.js';

export default function HomePage() {
  const { shippingPromoText } = useShipping();
  const [featured, setFeatured] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const recent = getRecentlyViewed();

  useEffect(() => {
    let active = true;
    Promise.all([
      shopApi.getCatalog({ page: 1, page_size: 8, include_facets: false, include_items: true }),
      shopApi.getCatalog({ page: 1, page_size: 8, sort: 'best_selling', include_facets: false, include_items: true }),
    ]).then(([featuredRes, bestRes]) => {
      if (!active) return;
      if (featuredRes.ok) setFeatured(featuredRes.items);
      if (bestRes.ok) setBestSellers(bestRes.items);
      if (!featuredRes.ok && !bestRes.ok) {
        setError(featuredRes.message || featuredRes.error || 'โหลดสินค้าไม่สำเร็จ');
      } else {
        setError(null);
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

      {recent.length > 0 && (
        <section className="space-y-4 lg:space-y-6">
          <SectionHeader title="ดูล่าสุด" />
          <div className="product-grid">
            {recent.slice(0, 6).map((p) => (
              <ProductCard key={p.tiktok_sku_id || p.tiktok_product_id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4 lg:space-y-6">
        <SectionHeader title="สินค้าขายดี" action={{ label: 'ดูทั้งหมด', href: '/catalog?sort=best_selling' }} />
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : error ? (
          <BannerAlert variant="error">{error}</BannerAlert>
        ) : (
          <div className="product-grid">
            {bestSellers.map((p) => (
              <ProductCard key={`best-${p.tiktok_product_id || p.tiktok_sku_id}`} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 lg:space-y-6">
        <SectionHeader title="สินค้าแนะนำ" action={{ label: 'ดูทั้งหมด', href: '/catalog' }} />
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : error ? null : (
          <div className="product-grid">
            {featured.map((p) => (
              <ProductCard key={p.tiktok_product_id || p.tiktok_sku_id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
