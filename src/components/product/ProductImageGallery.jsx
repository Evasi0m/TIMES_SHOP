import { useEffect, useMemo, useRef, useState } from 'react';
import ProductImagePromos from '../ProductImagePromos.jsx';

function WatchPlaceholder({ className = '' }) {
  return (
    <div
      className={`flex aspect-square w-full items-center justify-center bg-canvas text-muted ${className}`}
      aria-hidden="true"
    >
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="7" />
        <path d="M12 9v3l2 1" />
        <path d="M9 2h6M9 22h6" />
      </svg>
    </div>
  );
}

export default function ProductImageGallery({ images = [], alt = 'สินค้า' }) {
  const trackRef = useRef(null);
  const jumpingRef = useRef(false);

  const slides = useMemo(
    () => images.map((url) => String(url || '').trim()).filter(Boolean),
    [images],
  );
  const count = slides.length;
  const loop = count > 1;
  const slideKey = slides.join('|');
  const extended = loop ? [slides[count - 1], ...slides, slides[0]] : slides;

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!loop) {
      setIndex(0);
      return undefined;
    }

    const track = trackRef.current;
    if (!track) return undefined;

    let inited = false;

    function scrollToExtended(slideIndex, behavior = 'auto') {
      if (!track.clientWidth) return;
      jumpingRef.current = true;
      track.scrollTo({ left: slideIndex * track.clientWidth, behavior });
    }

    function initPosition() {
      if (!track.clientWidth || inited) return;
      inited = true;
      scrollToExtended(1, 'auto');
      setIndex(0);
    }

    initPosition();
    const ro = new ResizeObserver(initPosition);
    ro.observe(track);

    function onScroll() {
      if (jumpingRef.current || !track.clientWidth) return;
      const i = Math.round(track.scrollLeft / track.clientWidth);
      if (i >= 1 && i <= count) {
        setIndex((prev) => (prev === i - 1 ? prev : i - 1));
      }
    }

    function onScrollEnd() {
      if (!track.clientWidth) return;
      jumpingRef.current = false;

      const i = Math.round(track.scrollLeft / track.clientWidth);
      if (i <= 0) {
        scrollToExtended(count, 'auto');
        setIndex(count - 1);
      } else if (i >= count + 1) {
        scrollToExtended(1, 'auto');
        setIndex(0);
      } else {
        setIndex((prev) => (prev === i - 1 ? prev : i - 1));
      }
    }

    track.addEventListener('scroll', onScroll, { passive: true });
    track.addEventListener('scrollend', onScrollEnd);
    return () => {
      ro.disconnect();
      track.removeEventListener('scroll', onScroll);
      track.removeEventListener('scrollend', onScrollEnd);
      jumpingRef.current = false;
    };
  }, [loop, count, slideKey]);

  if (!count) {
    return (
      <div className="pdp-hero-gallery">
        <div className="bg-surface-soft">
          <WatchPlaceholder />
        </div>
        <ProductImagePromos />
      </div>
    );
  }

  if (!loop) {
    return (
      <div className="pdp-hero-gallery">
        <div className="bg-surface-soft">
          <img
            src={slides[0]}
            alt={alt}
            className="aspect-square w-full object-cover"
            draggable={false}
          />
        </div>
        <ProductImagePromos />
      </div>
    );
  }

  return (
    <div className="pdp-hero-gallery">
      <div
        ref={trackRef}
        className="pdp-gallery-track bg-surface-soft touch-pan-x"
        aria-label="รูปสินค้า"
      >
        {extended.map((url, i) => (
          <div key={`${url}-${i}`} className="pdp-gallery-slide">
            <img
              src={url}
              alt={alt}
              className="aspect-square w-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>

      <ProductImagePromos />

      <span className="pdp-gallery-counter" aria-live="polite">
        {index + 1}/{count}
      </span>
    </div>
  );
}
