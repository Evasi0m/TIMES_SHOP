import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProductDisplayLines, getProductImageAlt, isCasioBrandProduct } from '../lib/product-display.js';
import {
  getListingCardDisplayPrice,
  getListingCardImage,
  getListingCardTitle,
  getListingProductLink,
  isListingCard,
} from '../lib/listing-display.js';
import { formatUnitsSold, shouldShowUnitsSold } from '../lib/units-sold.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ProductImage from './ProductImage.jsx';
import BadgePill from './ui/BadgePill.jsx';
import PromoPriceDisplay from './PromoPriceDisplay.jsx';
import ProductImagePromos from './ProductImagePromos.jsx';
import { isNewProduct } from '../lib/is-new-product.js';

export default function ProductCard({ product }) {
  const listing = isListingCard(product);
  const inStock = product.in_stock ?? product.stock_available > 0;
  const title = listing ? getListingCardTitle(product) : getProductDisplayLines(product).title;
  const lowStock = !listing && inStock && product.stock_available <= 3;
  const link = getListingProductLink(product);
  const cardProduct = listing
    ? { ...product, image_url: getListingCardImage(product) }
    : product;
  const showNewBadge = isNewProduct(product);
  const showCasioBadge = isCasioBrandProduct(product);
  const displayPrice = listing ? getListingCardDisplayPrice(product) : product.unit_price;
  const unitsSold = product.units_sold;
  const canQuickAdd = inStock && (!listing || Number(product.sku_count) <= 1);
  const { addItem } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  function buildCartProduct() {
    if (listing) {
      return {
        tiktok_sku_id: product.default_sku_id || product.tiktok_sku_id,
        product_name: product.product_name,
        sku_name: product.sku_name || '',
        seller_sku: product.seller_sku,
        image_url: getListingCardImage(product),
        unit_price: product.price_min ?? product.unit_price,
        stock_available: product.stock_available ?? 99,
      };
    }
    return product;
  }

  async function handleQuickAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!canQuickAdd) {
      navigate(link);
      return;
    }
    setAdding(true);
    try {
      addItem(buildCartProduct(), 1);
      toast.success('เพิ่มลงตะกร้าแล้ว');
    } finally {
      setAdding(false);
    }
  }

  return (
    <Link to={link} className="product-card hover-lift flex cursor-pointer flex-col">
      <div className="product-card__media">
        <ProductImage
          product={cardProduct}
          alt={listing ? title : getProductImageAlt(product)}
          className="h-full w-full"
          imgClassName={`h-full w-full object-cover ${!inStock ? 'opacity-50' : ''}`}
        />
        {showNewBadge && (
          <BadgePill variant="new" className="product-card__new-badge w-fit">
            ใหม่
          </BadgePill>
        )}
        <ProductImagePromos />
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <BadgePill variant="error" className="w-fit">
              สินค้าหมด
            </BadgePill>
          </div>
        )}
      </div>

      <div className="product-card__body">
        <h3 className="product-card__title">
          {showCasioBadge && (
            <BadgePill variant="casio" className="product-card__title-badge badge-compact">
              CASIO
            </BadgePill>
          )}
          {title}
        </h3>

        <div className="product-card__price-row">
          <PromoPriceDisplay value={displayPrice} size="md" showStrike={false} />
          {shouldShowUnitsSold(unitsSold) && (
            <span className="product-card__sold">{formatUnitsSold(unitsSold)}</span>
          )}
        </div>

        {lowStock && (
          <p className="text-xs text-warning">เหลือ {product.stock_available} ชิ้น</p>
        )}

        {inStock && (
          <button
            type="button"
            className="btn-secondary mt-2 w-full min-h-[40px] text-sm"
            onClick={handleQuickAdd}
            disabled={adding}
          >
            {canQuickAdd ? (adding ? 'กำลังเพิ่ม...' : 'ใส่ตะกร้า') : 'เลือกตัวเลือก'}
          </button>
        )}
      </div>
    </Link>
  );
}
