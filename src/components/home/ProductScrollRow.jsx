import { useRef } from 'react';
import SectionHeader from '../layout/SectionHeader.jsx';
import HomeProductCard from './HomeProductCard.jsx';

function scrollByAmount(node, direction) {
  if (!node) return;
  const amount = Math.max(240, node.clientWidth * 0.75);
  node.scrollBy({ left: direction * amount, behavior: 'smooth' });
}

export default function ProductScrollRow({ title, action, products = [], showRank = false }) {
  const trackRef = useRef(null);
  if (!products.length) return null;

  return (
    <section className="home-section">
      <SectionHeader
        title={title}
        action={action ? { label: 'ดูเพิ่มเติม', href: action } : undefined}
      />
      <div className="home-scroll-row-wrap">
        <button
          type="button"
          className="home-scroll-row__nav home-scroll-row__nav--prev hidden lg:flex"
          aria-label="เลื่อนซ้าย"
          onClick={() => scrollByAmount(trackRef.current, -1)}
        >
          ‹
        </button>
        <div ref={trackRef} className="home-scroll-row" aria-label={title}>
          {products.map((product, index) => (
            <HomeProductCard
              key={product.tiktok_product_id || product.tiktok_sku_id || index}
              product={product}
              rank={showRank ? index + 1 : undefined}
            />
          ))}
        </div>
        <button
          type="button"
          className="home-scroll-row__nav home-scroll-row__nav--next hidden lg:flex"
          aria-label="เลื่อนขวา"
          onClick={() => scrollByAmount(trackRef.current, 1)}
        >
          ›
        </button>
      </div>
    </section>
  );
}
