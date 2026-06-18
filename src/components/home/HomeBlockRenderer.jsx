import { useEffect, useState } from 'react';
import { shopApi } from '../../lib/shop-api.js';
import {
  buildHomeCatalogParams,
  getCatalogSortForSource,
  getProductRowSeeAllHref,
} from '../../lib/homepage.js';
import { normalizeListingItems } from '../../lib/listing-display.js';
import HomeBanner from './HomeBanner.jsx';
import CouponRow from './CouponRow.jsx';
import ProductScrollRow from './ProductScrollRow.jsx';
import { ProductScrollSkeleton } from '../Skeleton.jsx';

function ProductRowBlock({ block }) {
  const source = block?.config?.source || 'best_selling';
  const limit = Math.min(20, Math.max(4, Number(block?.config?.limit) || 10));
  const [products, setProducts] = useState(() => normalizeListingItems(block.items ?? []));
  const [loading, setLoading] = useState(source !== 'popular');

  useEffect(() => {
    if (source === 'popular') {
      setProducts(normalizeListingItems(block.items ?? []));
      setLoading(false);
      return;
    }
    let active = true;
    const sort = getCatalogSortForSource(source);
    shopApi
      .getCatalog(buildHomeCatalogParams({ page_size: limit, sort }))
      .then((res) => {
        if (!active) return;
        if (res.ok) setProducts(normalizeListingItems(res.items ?? []));
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [source, limit, block.items]);

  if (loading) return <ProductScrollSkeleton count={5} />;
  if (!products.length) return null;

  return (
    <ProductScrollRow
      title={block.title}
      action={getProductRowSeeAllHref(source)}
      products={products}
      showRank={source === 'popular'}
    />
  );
}

export default function HomeBlockRenderer({ block }) {
  if (!block?.kind) return null;
  if (block.kind === 'banner') return <HomeBanner block={block} />;
  if (block.kind === 'coupon_row') return <CouponRow block={block} />;
  if (block.kind === 'product_row') return <ProductRowBlock block={block} />;
  return null;
}
