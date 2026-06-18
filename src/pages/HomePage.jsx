import { useEffect, useState } from 'react';
import { shopApi } from '../lib/shop-api.js';
import { ProductScrollSkeleton } from '../components/Skeleton.jsx';
import SectionHeader from '../components/layout/SectionHeader.jsx';
import BannerAlert from '../components/ui/BannerAlert.jsx';
import HomeBlockRenderer from '../components/home/HomeBlockRenderer.jsx';
import HomeStoreProfile from '../components/home/HomeStoreProfile.jsx';
import ProductScrollRow from '../components/home/ProductScrollRow.jsx';
import HomeProductCard from '../components/home/HomeProductCard.jsx';
import { normalizeListingItems } from '../lib/listing-display.js';
import { buildHomeCatalogParams } from '../lib/homepage.js';
import { getRecentlyViewed } from '../hooks/useRecentlyViewed.js';

function LegacyHomeSections({ loading, error, bestSellers, featured }) {
  if (error && !bestSellers.length && !featured.length) {
    return <BannerAlert variant="error">{error}</BannerAlert>;
  }

  if (loading) {
    return (
      <>
        <ProductScrollSkeleton count={5} />
        <ProductScrollSkeleton count={5} />
      </>
    );
  }

  return (
    <>
      <ProductScrollRow
        title="สินค้าขายดี"
        action="/catalog?sort=best_selling"
        products={bestSellers}
      />
      <ProductScrollRow
        title="สินค้าแนะนำ"
        action="/catalog?sort=newest"
        products={featured}
      />
    </>
  );
}

export default function HomePage() {
  const [blocks, setBlocks] = useState([]);
  const [blocksLoading, setBlocksLoading] = useState(true);
  const [featured, setFeatured] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [legacyLoading, setLegacyLoading] = useState(true);
  const [error, setError] = useState(null);
  const recent = getRecentlyViewed();

  useEffect(() => {
    let active = true;
    shopApi.getHomepageConfig().then((res) => {
      if (!active) return;
      if (res.ok) setBlocks(res.blocks ?? []);
      setBlocksLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      shopApi.getCatalog(buildHomeCatalogParams({ page_size: 10, sort: 'newest' })),
      shopApi.getCatalog(buildHomeCatalogParams({ page_size: 10, sort: 'best_selling' })),
    ])
      .then(([featuredRes, bestRes]) => {
        if (!active) return;
        if (featuredRes.ok) setFeatured(normalizeListingItems(featuredRes.items));
        if (bestRes.ok) setBestSellers(normalizeListingItems(bestRes.items));
        if (!featuredRes.ok && !bestRes.ok) {
          setError(featuredRes.message || featuredRes.error || 'โหลดสินค้าไม่สำเร็จ');
        } else {
          setError(null);
        }
        setLegacyLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError('โหลดสินค้าไม่สำเร็จ');
        setLegacyLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const useConfiguredBlocks = !blocksLoading && blocks.length > 0;
  const hideCompactCoupons = blocks.some(
    (b) => b.kind === 'coupon_row' && b.is_active !== false
  );

  return (
    <div className="home-page space-y-6 lg:space-y-10">
      <HomeStoreProfile hideCompactCoupons={hideCompactCoupons} />

      {recent.length > 0 && (
        <section className="home-section">
          <SectionHeader title="ดูล่าสุด" />
          <div className="home-scroll-row" aria-label="ดูล่าสุด">
            {recent.slice(0, 6).map((p) => (
              <HomeProductCard
                key={p.tiktok_product_id || p.tiktok_sku_id}
                product={p}
              />
            ))}
          </div>
        </section>
      )}

      {blocksLoading ? (
        <ProductScrollSkeleton count={5} />
      ) : useConfiguredBlocks ? (
        blocks.map((block) => <HomeBlockRenderer key={block.id} block={block} />)
      ) : (
        <LegacyHomeSections
          loading={legacyLoading}
          error={error}
          bestSellers={bestSellers}
          featured={featured}
        />
      )}
    </div>
  );
}
