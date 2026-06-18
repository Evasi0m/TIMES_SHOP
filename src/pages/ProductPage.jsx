import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { shopApi } from '../lib/shop-api.js';
import {
  computeListingPriceRange,
  computeListingUnitsSold,
  getListingGalleryImages,
} from '../lib/listing-display.js';
import { getSkuDisplayName } from '../lib/product-display.js';
import { formatUnitsSold, shouldShowUnitsSold } from '../lib/units-sold.js';
import { useCart } from '../context/CartContext.jsx';
import { useShipping } from '../context/ShippingContext.jsx';
import { usePromo } from '../context/PromoContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ProductActionBar from '../components/product/ProductActionBar.jsx';
import ProductImageGallery from '../components/product/ProductImageGallery.jsx';
import ProductTabNav from '../components/product/ProductTabNav.jsx';
import RelatedProductsRow from '../components/product/RelatedProductsRow.jsx';
import WishlistButton from '../components/product/WishlistButton.jsx';
import VariantBuySheet from '../components/product/VariantBuySheet.jsx';
import { trackRecentlyViewed, getRecentlyViewed } from '../hooks/useRecentlyViewed.js';
import { buildViewSnapshot, shouldTrackProductView } from '../lib/homepage.js';
import { isHtmlDescription } from '../lib/product-description.js';
import ProductDescriptionCard from '../components/product/ProductDescriptionCard.jsx';
import PromoPriceDisplay from '../components/PromoPriceDisplay.jsx';
import BannerAlert from '../components/ui/BannerAlert.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { ChevronLeftIcon } from '../components/icons.jsx';

export default function ProductPage() {
  const { skuId, productId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addItem, replaceCart } = useCart();
  const { shippingLabel } = useShipping();
  const { hasFreeShippingPromo } = usePromo();
  const toast = useToast();

  const [listing, setListing] = useState(null);
  const [skus, setSkus] = useState([]);
  const [selectedSkuId, setSelectedSkuId] = useState('');
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState('buy');

  const overviewRef = useRef(null);
  const descriptionRef = useRef(null);
  const relatedRef = useRef(null);
  const tabLockRef = useRef(false);

  const querySku = searchParams.get('sku') || '';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setQty(1);
    setNotFound(false);
    setError(null);
    setDescription('');
    setDescriptionLoading(false);

    const params = productId
      ? { tiktok_product_id: productId, ...(querySku ? { tiktok_sku_id: querySku } : {}) }
      : { tiktok_sku_id: skuId };

    shopApi.getProduct(params).then((res) => {
      if (!active) return;
      if (res.ok) {
        setListing(res.listing || null);
        setSkus(res.skus || (res.product ? [res.product] : []));
        setSelectedSkuId(res.selected_sku_id || res.product?.tiktok_sku_id || '');
        setRelated(res.related || []);
      } else {
        setNotFound(true);
        setError(res.message || res.error || 'โหลดสินค้าไม่สำเร็จ');
      }
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setNotFound(true);
      setError('โหลดสินค้าไม่สำเร็จ กรุณาลองใหม่');
      setLoading(false);
    });
    return () => {
      active = false;
    };
    // Only refetch when navigating to a different product — not ?sku= changes within PDP.
  }, [skuId, productId]);

  const product = useMemo(
    () => skus.find((s) => s.tiktok_sku_id === selectedSkuId) || skus[0] || null,
    [skus, selectedSkuId],
  );

  useEffect(() => {
    const productKey =
      listing?.tiktok_product_id
      || product?.tiktok_product_id
      || productId
      || skus[0]?.tiktok_product_id;
    if (!productKey || loading || notFound) return;

    let active = true;
    setDescriptionLoading(true);

    shopApi.getProductDescription({ tiktok_product_id: productKey }).then((res) => {
      if (!active) return;
      if (res.ok) {
        setDescription(String(res.description || '').trim());
      } else {
        setDescription('');
      }
      setDescriptionLoading(false);
    }).catch(() => {
      if (!active) return;
      setDescription('');
      setDescriptionLoading(false);
    });

    return () => {
      active = false;
    };
  }, [listing?.tiktok_product_id, product?.tiktok_product_id, productId, skus, loading, notFound]);

  // Sync selected variant from URL (back/forward) using already-loaded skus — no refetch.
  useEffect(() => {
    if (!querySku || !skus.length) return;
    if (querySku === selectedSkuId) return;
    if (skus.some((s) => s.tiktok_sku_id === querySku)) {
      setSelectedSkuId(querySku);
      setQty(1);
    }
  }, [querySku, skus, selectedSkuId]);

  const priceRange = useMemo(() => computeListingPriceRange(skus), [skus]);
  const listingUnitsSold = useMemo(() => computeListingUnitsSold(skus), [skus]);
  const galleryImages = useMemo(
    () => getListingGalleryImages(listing, skus),
    [listing?.listing_image_url, listing?.tiktok_product_id, skus],
  );
  useEffect(() => {
    if (!product) return;
    trackRecentlyViewed(product);
  }, [product?.tiktok_sku_id]);

  useEffect(() => {
    const productKey = listing?.tiktok_product_id || product?.tiktok_product_id;
    if (!productKey || !skus.length) return;
    if (!shouldTrackProductView(productKey)) return;

    const snapshot = buildViewSnapshot({
      tiktok_product_id: productKey,
      product_name: listing?.product_name || product?.product_name,
      image_url: listing?.listing_image_url || listing?.image_url || product?.image_url,
      listing_image_url: listing?.listing_image_url || product?.image_url,
      price_min: priceRange.min,
      price_max: priceRange.max,
      price_min_in_stock: priceRange.min,
      default_sku_id: selectedSkuId || product?.tiktok_sku_id,
      tiktok_sku_id: selectedSkuId || product?.tiktok_sku_id,
      sku_count: skus.length,
      units_sold: listingUnitsSold,
      in_stock: skus.some((s) => s.in_stock ?? s.stock_available > 0),
      stock_available: skus.reduce((sum, s) => sum + (Number(s.stock_available) || 0), 0),
    });
    if (!snapshot) return;
    shopApi.trackProductView({ tiktok_product_id: productKey, snapshot });
  }, [listing, product, skus, selectedSkuId, priceRange, listingUnitsSold]);

  const recentlyViewed = useMemo(
    () => getRecentlyViewed(product?.tiktok_sku_id).slice(0, 8),
    [product?.tiktok_sku_id],
  );

  const hasAnyStock = useMemo(
    () => skus.some((s) => s.in_stock ?? s.stock_available > 0),
    [skus],
  );

  useEffect(() => {
    if (!productId || !selectedSkuId) return;
    if (searchParams.get('sku') === selectedSkuId) return;
    setSearchParams({ sku: selectedSkuId }, { replace: true });
  }, [productId, selectedSkuId, searchParams, setSearchParams]);

  useEffect(() => {
    const sections = [
      { id: 'overview', el: overviewRef.current },
      { id: 'description', el: descriptionRef.current },
      { id: 'related', el: relatedRef.current },
    ].filter((s) => s.el);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (tabLockRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.dataset?.section) {
          setActiveTab(visible[0].target.dataset.section);
        }
      },
      { rootMargin: '-40% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    );

    for (const { el } of sections) observer.observe(el);
    return () => observer.disconnect();
  }, [loading, related.length, description, descriptionLoading]);

  function handleSelectVariant(nextSkuId) {
    if (nextSkuId === selectedSkuId) return;
    setSelectedSkuId(nextSkuId);
    setQty(1);
    if (productId) {
      setSearchParams({ sku: nextSkuId }, { replace: true });
    } else if (listing?.tiktok_product_id) {
      navigate(`/product/p/${listing.tiktok_product_id}?sku=${encodeURIComponent(nextSkuId)}`, { replace: true });
    } else {
      navigate(`/product/${nextSkuId}`, { replace: true });
    }
  }

  function openSheet(mode) {
    setSheetMode(mode);
    setSheetOpen(true);
  }

  function scrollToTab(tabId) {
    const map = {
      overview: overviewRef,
      description: descriptionRef,
      related: relatedRef,
    };
    const el = map[tabId]?.current;
    if (!el) return;
    setActiveTab(tabId);
    tabLockRef.current = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      tabLockRef.current = false;
    }, 600);
  }

  function handleSheetConfirm({ sku, qty: nextQty, mode }) {
    const name = getSkuDisplayName(sku);
    if (mode === 'buy') {
      replaceCart(sku, nextQty);
      setSheetOpen(false);
      navigate('/checkout');
      return;
    }
    addItem(sku, nextQty);
    setSheetOpen(false);
    toast.success(`เพิ่ม "${name}" ลงตะกร้าแล้ว`);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="aspect-square w-full rounded-none md:rounded-card" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="font-display text-xl text-ink">ไม่พบสินค้า</p>
        {error && <BannerAlert variant="error">{error}</BannerAlert>}
        <Link to="/catalog" className="btn-primary mt-4 inline-flex">
          กลับไปหน้าสินค้า
        </Link>
      </div>
    );
  }

  const pageTitle = listing?.product_name || product.product_name;
  const inStock = product.in_stock ?? product.stock_available > 0;

  return (
    <>
      <div className="pdp-page-pad space-y-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="link-btn mb-3 inline-flex items-center gap-1"
        >
          <ChevronLeftIcon size={18} /> กลับ
        </button>

        <ProductImageGallery images={galleryImages} alt={pageTitle} />

        <div className="mt-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <PromoPriceDisplay min={priceRange.min} max={priceRange.max} size="xl" />
            <WishlistButton product={product} className="mt-1" />
          </div>
          <h1 className="line-clamp-2 font-display text-xl text-ink lg:text-2xl">{pageTitle}</h1>
          <p className="text-sm text-muted">
            {shouldShowUnitsSold(listingUnitsSold) && (
              <span>{formatUnitsSold(listingUnitsSold)}</span>
            )}
            {shouldShowUnitsSold(listingUnitsSold) && skus.length > 1 && ' · '}
            {skus.length > 1 && `${skus.length.toLocaleString('th-TH')} ตัวเลือก`}
          </p>
          <p className="text-sm text-body">
            <span className="font-semibold text-primary">
              {hasFreeShippingPromo ? 'ส่งฟรี' : shippingLabel}
            </span>
            <span className="text-muted"> · ส่งทั่วประเทศ</span>
          </p>
        </div>

        <div className="mt-4">
          <ProductTabNav activeId={activeTab} onSelect={scrollToTab} />
        </div>

        <section
          ref={overviewRef}
          data-section="overview"
          className="pdp-section space-y-3"
          aria-labelledby="pdp-overview-title"
        >
          <h2 id="pdp-overview-title" className="font-display text-lg text-ink">
            ภาพรวม
          </h2>
          <div className="card-canvas space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted">ราคา</span>
              <PromoPriceDisplay min={priceRange.min} max={priceRange.max} size="md" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted">ตัวเลือกที่เลือก</span>
              <span className="text-sm font-medium text-ink">{getSkuDisplayName(product)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted">สถานะ</span>
              {inStock ? (
                <span className="text-sm text-success">
                  มีสินค้า
                  {product.stock_available <= 10 && (
                    <span className="text-muted"> (เหลือ {product.stock_available})</span>
                  )}
                </span>
              ) : (
                <span className="text-sm font-medium text-error">สินค้าหมด</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted">การจัดส่ง</span>
              <span className="text-sm font-medium text-ink">
                {hasFreeShippingPromo ? 'ส่งฟรี' : shippingLabel}
              </span>
            </div>
          </div>
        </section>

        <section
          ref={descriptionRef}
          data-section="description"
          className="pdp-section space-y-3"
          aria-labelledby="pdp-description-title"
        >
          <h2 id="pdp-description-title" className="font-display text-lg text-ink">
            คำอธิบาย
          </h2>
          {descriptionLoading ? (
            <div className="card-canvas space-y-2 p-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : description ? (
            <ProductDescriptionCard
              description={description}
              html={isHtmlDescription(description)}
            />
          ) : (
            <div className="card-canvas p-6 text-center text-sm text-muted">
              ยังไม่มีคำอธิบายสินค้า
            </div>
          )}
        </section>

        <section
          ref={relatedRef}
          data-section="related"
          className="pdp-section space-y-3"
          aria-labelledby="pdp-related-title"
        >
          <h2 id="pdp-related-title" className="font-display text-lg text-ink">
            รายการแนะนำ
          </h2>
          {related.length > 0 ? (
            <RelatedProductsRow products={related} />
          ) : recentlyViewed.length > 0 ? (
            <RelatedProductsRow products={recentlyViewed} />
          ) : (
            <div className="card-canvas p-6 text-center text-sm text-muted">
              ยังไม่มีสินค้าแนะนำ
            </div>
          )}
        </section>

        <ProductActionBar
          price={product.unit_price}
          inStock={hasAnyStock}
          onAddToCart={() => openSheet('add')}
          onBuyNow={() => openSheet('buy')}
        />
      </div>

      <VariantBuySheet
        open={sheetOpen}
        mode={sheetMode}
        skus={skus}
        selectedSku={product}
        qty={qty}
        onQtyChange={setQty}
        onSelectSku={handleSelectVariant}
        onClose={() => setSheetOpen(false)}
        onConfirm={handleSheetConfirm}
      />
    </>
  );
}
